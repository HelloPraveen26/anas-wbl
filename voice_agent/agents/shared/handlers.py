"""Dynamic tool handling and data collection for voice agents"""
import logging
from typing import Dict

import aiohttp
from livekit.agents import RunContext, function_tool

from .config import BACKEND_API_URL

logger = logging.getLogger("handlers")


class DynamicToolHandler:
    """Handles dynamic tool configuration and data collection with metadata pre-population"""

    def __init__(self, tool_config: dict, assistant_id: str, metadata: dict = None):
        """Initialize tool handler for a SINGLE tool"""
        self.tool_config = tool_config
        self.tool_name = tool_config.get("toolName", "unknown_tool")
        self.webhook_url = tool_config.get("webhookUrl")
        self.assistant_id = assistant_id
        self.collected_data = {}
        self.metadata = metadata or {}
        self.transcript = []  # Keep track of conversation for summary

    async def prepopulate_from_metadata(self):
        """Pre-populate collected_data with values from metadata that match tool parameters"""
        if not self.tool_config or not self.metadata:
            return

        params = self.tool_config.get("parameters", {})
        if not params:
            return

        logger.info(f"🔍 [{self.tool_name}] Checking metadata for pre-population...")
        prepopulated_count = 0

        for param_name in params.keys():
            metadata_value = None

            # Try exact match first
            if param_name in self.metadata:
                metadata_value = self.metadata[param_name]
            # Try lowercase match
            elif param_name.lower() in {k.lower(): v for k, v in self.metadata.items()}:
                matching_keys = [
                    k for k in self.metadata.keys() if k.lower() == param_name.lower()
                ]
                if matching_keys:
                    metadata_value = self.metadata[matching_keys[0]]

            if metadata_value is not None and metadata_value != "":
                self.collected_data[param_name] = str(metadata_value)
                prepopulated_count += 1
                logger.info(f"✅ [{self.tool_name}] PRE-POPULATED: {param_name}")

        if prepopulated_count > 0:
            logger.info(
                f"🎯 [{self.tool_name}] Pre-populated {prepopulated_count} parameter(s)!"
            )

    async def collect_data(self, key: str, value: str):
        """Store user-provided information with flexible key matching"""
        normalized_key = key.strip().lower()
        actual_key = key

        if self.tool_config and self.tool_config.get("parameters"):
            params = self.tool_config.get("parameters", {})
            for p_name in params.keys():
                if p_name.strip().lower() == normalized_key:
                    actual_key = p_name
                    break

        self.collected_data[actual_key] = value
        logger.info(f"✅ [{self.tool_name}] STORED: {actual_key} = {value}")


    def get_missing_parameters(self):
        """Get list of parameters that haven't been collected yet"""
        if not self.tool_config:
            return []

        params = self.tool_config.get("parameters", {})
        missing = []

        for param_name, param_config in params.items():
            if param_config.get("required", False):
                if param_name not in self.collected_data:
                    missing.append(param_name)

        return missing

    async def add_to_transcript(self, role: str, text: str):
        """Add a message to the internal transcript for summary generation"""
        self.transcript.append(f"{role.capitalize()}: {text}")

    def get_auto_summary(self):
        """Generate a concise summary from the call data and transcript"""
        has_user_speech = any("User:" in line for line in self.transcript)
        has_agent_speech = any("Assistant:" in line for line in self.transcript)

        if not self.transcript and not self.collected_data:
            return "Call disconnected immediately after connection."

        if has_agent_speech and not has_user_speech and not self.collected_data:
            return "Silent call. Agent greeted user, but there was no response."

        summary_parts = []
        if self.collected_data:
            summary_parts.append(
                f"User provided: {', '.join(self.collected_data.keys())}"
            )

        missing = self.get_missing_parameters()
        missing = [p for p in missing if "summary" not in p.lower()]

        if not self.collected_data:
            return "Call ended early. Conversation occurred but no data collected."
        elif missing:
            return f"{'. '.join(summary_parts)}. Missing: {', '.join(missing)}. Abrupt hang-up."
        else:
            return (
                f"{'. '.join(summary_parts)}. All information collected successfully."
            )

    async def send_to_webhook(self, is_final: bool = False):
        """Send collected data to backend for webhook routing"""
        try:
            complete_data = {}
            if self.tool_config and self.tool_config.get("parameters"):
                params = self.tool_config.get("parameters", {})
                for param_name in params.keys():
                    found_value = "not available"
                    normalized_param = param_name.strip().lower()

                    for collected_key, value in self.collected_data.items():
                        if collected_key.strip().lower() == normalized_param:
                            found_value = value
                            break

                    if found_value == "not available" and (
                        "summary" in normalized_param
                        or "call_summary" in normalized_param
                    ):
                        if is_final:
                            found_value = self.get_auto_summary()
                        else:
                            found_value = "Summary pending end of call"

                    complete_data[param_name] = found_value
            else:
                complete_data = self.collected_data

            payload = {
                "assistantId": self.assistant_id,
                "toolName": self.tool_name,
                "collectedData": complete_data,
            }

            backend_url = f"{BACKEND_API_URL}/api/v1/assistants/agent-webhook"
            async with aiohttp.ClientSession() as session:
                async with session.post(backend_url, json=payload) as resp:
                    if resp.status in [200, 201]:
                        logger.info(f"✅ [{self.tool_name}] Webhook sent successfully")
                        return True
                    return False
        except Exception as e:
            logger.error(f"❌ [{self.tool_name}] Webhook failed: {e}")
            return False

    def get_tool_instructions(self):
        """Generate LLM instructions for this specific tool"""
        if not self.tool_config:
            return ""
        params = self.tool_config.get("parameters", {})

        needed = []
        for p_name, cfg in params.items():
            if "summary" in p_name.lower():
                continue
            if p_name not in self.collected_data:
                status = "REQUIRED" if cfg.get("required") else "OPTIONAL"
                needed.append(
                    f" - {p_name} ({status}): {cfg.get('description', p_name)}"
                )

        if not needed:
            return ""

        prompt = f"\n\n🔧 TOOL: {self.tool_name}\n"
        prompt += (
            "ALREADY COLLECTED (DO NOT ASK): "
            + ", ".join(self.collected_data.keys())
            + "\n"
        )
        prompt += "STILL NEED TO COLLECT:\n" + "\n".join(needed)
        prompt += f"\n👉 RULE: Call collect_{self.tool_name}(key, value) immediately when user provides these details.\n"
        return prompt


async def load_all_tools(assistant_id: str) -> list:
    """Load ALL tool configurations for an assistant from backend"""
    try:
        url = f"{BACKEND_API_URL}/api/v1/assistants/tool-config/{assistant_id}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    res = await resp.json()
                    if res.get("success"):
                        data = res.get("data", [])
                        return [data] if isinstance(data, dict) else data
        return []
    except Exception as e:
        logger.error(f"❌ Error loading tools: {e}")
        return []


class ToolFactory:
    """Factory for creating function_tool wrappers from tool handlers"""

    @staticmethod
    def create_tools(tool_handlers: Dict[str, DynamicToolHandler]):
        """Generate function_tool wrappers from tool configurations"""
        tools = []
        for name, handler in tool_handlers.items():
            # Create a tool function for each handler
            tool_fn = ToolFactory._make_tool_function(handler, f"collect_{name}")
            tools.append(tool_fn)
        return tools

    @staticmethod
    def _make_tool_function(handler: DynamicToolHandler, fn_name: str):
        """Create a function_tool wrapper for a specific handler"""

        @function_tool(name=fn_name, description=f"Store data for {fn_name}")
        async def tool_fn(ctx: RunContext, key: str, value: str):
            logger.info(f"🔧 Tool Call: {fn_name}({key}={value})")
            await handler.collect_data(key, value)
            missing = handler.get_missing_parameters()
            return f"✅ Stored {key}." + (
                f" Still need: {', '.join(missing)}"
                if missing
                else " All information collected!"
            )

        return tool_fn
