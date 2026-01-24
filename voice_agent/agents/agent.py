# agent.py (COMPLETE UPDATED VERSION with MULTIPLE TOOLS support)
import asyncio
import base64
import json
import logging
import os

import aiohttp
from dotenv import load_dotenv
from livekit.agents import (
    NOT_GIVEN,
    Agent,
    AgentFalseInterruptionEvent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
)
from livekit.agents import (
    llm as agent_llm,
)
from livekit.agents.inference.tts import TTSEncoding
from livekit.agents.telemetry import set_tracer_provider
from livekit.plugins import (
    azure,
    deepgram,
    elevenlabs,
    google,
    groq,
    lmnt,
    openai,
    sarvam,
    silero,
)
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.util.types import AttributeValue

logger = logging.getLogger("agent")
logging.basicConfig(level=logging.INFO)

load_dotenv(".env", override=True)


# -------------------------------------
# DynamicToolHandler (UPDATED FOR MULTIPLE TOOLS)
# -------------------------------------
class DynamicToolHandler:
    """Handles dynamic tool configuration and data collection with metadata pre-population"""

    def __init__(self, tool_config: dict, assistant_id: str, metadata: dict = None):
        """
        Initialize tool handler for a SINGLE tool

        Args:
            tool_config: Configuration for THIS specific tool
            assistant_id: ID of the assistant
            metadata: Metadata for pre-population
        """
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
        logger.info(f"📦 Available metadata: {json.dumps(self.metadata, indent=2)}")

        prepopulated_count = 0

        for param_name in params.keys():
            # Check if this parameter exists in metadata
            # Support both exact match and common variations
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
            # Try with underscores converted to spaces
            elif param_name.replace("_", " ") in self.metadata:
                metadata_value = self.metadata[param_name.replace("_", " ")]
            # Try with spaces converted to underscores
            elif param_name.replace(" ", "_") in self.metadata:
                metadata_value = self.metadata[param_name.replace(" ", "_")]

            if metadata_value is not None and metadata_value != "":
                # Convert to string if not already
                metadata_value = str(metadata_value)

                self.collected_data[param_name] = metadata_value
                prepopulated_count += 1
                logger.info(
                    f"✅ [{self.tool_name}] PRE-POPULATED: {param_name} = {metadata_value}"
                )

        if prepopulated_count > 0:
            logger.info("=" * 60)
            logger.info(
                f"🎯 [{self.tool_name}] PRE-POPULATED {prepopulated_count} parameter(s)!"
            )
            logger.info(
                f"📊 Pre-populated data: {json.dumps(self.collected_data, indent=2)}"
            )
            logger.info("=" * 60)
        else:
            logger.info(
                f"ℹ️ [{self.tool_name}] No matching parameters found in metadata"
            )

    async def collect_data(self, key: str, value: str):
        """Store user-provided information with flexible key matching"""
        # Normalize the incoming key
        normalized_key = key.strip().lower()

        # Find the actual key name from the configuration (handling whitespace/case)
        actual_key = key
        if self.tool_config and self.tool_config.get("parameters"):
            params = self.tool_config.get("parameters", {})
            for p_name in params.keys():
                if p_name.strip().lower() == normalized_key:
                    actual_key = p_name
                    break

        self.collected_data[actual_key] = value
        logger.info(f"✅ [{self.tool_name}] STORED: {actual_key} = {value}")

        missing = self.get_missing_parameters()
        if missing:
            logger.info(f"⏳ [{self.tool_name}] Still need: {', '.join(missing)}")
        else:
            logger.info(f"✅ [{self.tool_name}] All required parameters collected!")

    def get_missing_parameters(self):
        """Get list of parameters that haven't been collected yet"""
        if not self.tool_config:
            return []

        params = self.tool_config.get("parameters", {})
        missing = []

        for param_name, param_config in params.items():
            # Only check required parameters
            if param_config.get("required", False):
                if param_name not in self.collected_data:
                    missing.append(param_name)

        return missing

    async def add_to_transcript(self, role: str, text: str):
        """Add a message to the internal transcript for summary generation"""
        self.transcript.append(f"{role.capitalize()}: {text}")

    def get_auto_summary(self):
        """Generate a concise summary from the call data and transcript"""
        if not self.transcript and not self.collected_data:
            return "Call ended before conversation started."

        # Build summary based on what was collected
        summary_parts = []

        # Check what data was collected
        if self.collected_data:
            collected_items = [f"{k}" for k in self.collected_data.keys()]
            if collected_items:
                summary_parts.append(f"User provided: {', '.join(collected_items)}")

        # Check what was missing
        if self.tool_config and self.tool_config.get("parameters"):
            params = self.tool_config.get("parameters", {})
            required_params = [k for k, v in params.items() if v.get("required", False)]

            # Exclude summary fields from missing check
            required_params = [p for p in required_params if "summary" not in p.lower()]

            missing = [p for p in required_params if p not in self.collected_data]
            if missing:
                summary_parts.append(f"Missing: {', '.join(missing)}")

        # Determine call outcome
        if not self.collected_data:
            return "Call ended before any information was collected."
        elif missing:
            return f"{'. '.join(summary_parts)}. Call ended early."
        else:
            return f"{'. '.join(summary_parts)}. All required information collected successfully."

    def all_required_collected(self):
        """Check if all required parameters have been collected"""
        if not self.tool_config:
            return True

        params = self.tool_config.get("parameters", {})

        for param_name, param_config in params.items():
            if param_config.get("required", False):
                # 🆕 Skip required check for auto-populated summary fields
                normalized_param = param_name.strip().lower()
                if "summary" in normalized_param or "call_summary" in normalized_param:
                    continue

                # Use same normalization as collect_data
                found = False
                for collected_key in self.collected_data.keys():
                    if collected_key.strip().lower() == normalized_param:
                        found = True
                        break

                if not found:
                    logger.info(f"⏳ [{self.tool_name}] Missing required: {param_name}")
                    return False

        return True

    async def send_to_webhook(self, is_final: bool = False):
        """Send collected data to backend, which forwards to the configured webhook"""
        try:
            # Build complete payload with all parameters (collected + missing)
            complete_data = {}

            if self.tool_config and self.tool_config.get("parameters"):
                params = self.tool_config.get("parameters", {})

                # Add all defined parameters using flexible matching
                for param_name in params.keys():
                    found_value = "not available"
                    normalized_param = param_name.strip().lower()

                    # 1. Search in collected data
                    for collected_key, value in self.collected_data.items():
                        if collected_key.strip().lower() == normalized_param:
                            found_value = value
                            break

                    # 2. Fallback for "call summary" if still unavailable
                    if found_value == "not available" and (
                        "summary" in normalized_param
                        or "call_summary" in normalized_param
                    ):
                        if is_final:
                            logger.info(
                                f"📝 [{self.tool_name}] Auto-populating FINAL summary for: {param_name}"
                            )
                            found_value = self.get_auto_summary()
                        else:
                            found_value = "Summary will be generated at end of call"

                    complete_data[param_name] = found_value
            else:
                # If no config, just send whatever was collected
                complete_data = self.collected_data

            backend_url = "http://127.0.0.1:8000/api/v1/assistants/agent-webhook"
            payload = {
                "assistantId": self.assistant_id,
                "toolName": self.tool_name,  # 🆕 Include tool name
                "collectedData": complete_data,
            }

            logger.info("=" * 60)
            logger.info(f"📤 [{self.tool_name}] Sending to webhook")
            logger.info(f"🆔 Assistant ID: {self.assistant_id}")
            logger.info(f"🔧 Tool Name: {self.tool_name}")
            logger.info(f"📊 Data: {json.dumps(complete_data, indent=2)}")
            logger.info("=" * 60)

            async with aiohttp.ClientSession() as session:
                async with session.post(backend_url, json=payload) as resp:
                    text = await resp.text()
                    # NestJS returns 201 for POST requests by default
                    if resp.status in [200, 201]:
                        try:
                            resp_json = json.loads(text)
                            if resp_json.get("success"):
                                logger.info(
                                    f"✅ [{self.tool_name}] Webhook sent successfully"
                                )
                                return True
                            else:
                                logger.error(
                                    f"⚠️ [{self.tool_name}] Backend reported failure: {text}"
                                )
                                return False
                        except:
                            logger.info(
                                f"✅ [{self.tool_name}] Webhook sent (Status: {resp.status})"
                            )
                            return True
                    else:
                        logger.error(
                            f"❌ [{self.tool_name}] Backend error: {resp.status}, {text}"
                        )
                        return False
        except Exception as e:
            logger.error(f"❌ [{self.tool_name}] Webhook send failed: {e}")
            return False

    def get_tool_instructions(self):
        """Generate additional instructions for data collection"""
        if not self.tool_config:
            return ""

        params = self.tool_config.get("parameters", {})
        if not params:
            return ""

        # Separate parameters into pre-populated and still needed
        prepopulated_params = []
        required_params = []
        optional_params = []

        for param_name, param_config in params.items():
            param_desc = param_config.get("description", param_name)
            param_type = param_config.get("type", "string")
            param_line = f"{param_name} ({param_type}): {param_desc}"

            # 🆕 Auto-exclude summary fields from being asked
            normalized_param = param_name.strip().lower()
            if "summary" in normalized_param or "call_summary" in normalized_param:
                prepopulated_params.append(f"{param_line} [AUTO-GENERATED]")
                continue

            # Check if already collected from metadata
            if param_name in self.collected_data:
                prepopulated_params.append(param_line)
            elif param_config.get("required", False):
                required_params.append(param_line)
            else:
                optional_params.append(param_line)

        instruction = "\n\n" + "=" * 50 + "\n"
        instruction += f"🔧 TOOL: {self.tool_name}\n"
        instruction += "=" * 50 + "\n\n"

        # Show what's already collected from metadata
        if prepopulated_params:
            instruction += "✅ ALREADY COLLECTED (from system):\n"
            for i, param in enumerate(prepopulated_params, 1):
                instruction += f"   {i}. {param}\n"
            instruction += "\n"
            instruction += "⚠️ DO NOT ask for the above information!\n\n"

        # Show what still needs to be collected
        if required_params:
            instruction += "🎯 STILL NEED TO COLLECT (required):\n"
            for i, param in enumerate(required_params, 1):
                instruction += f"   {i}. {param}\n"
            instruction += "\n"

        if optional_params:
            instruction += "📋 OPTIONAL:\n"
            for i, param in enumerate(optional_params, 1):
                instruction += f"   {i}. {param}\n"
            instruction += "\n"

        instruction += "🎯 RULES:\n"
        instruction += f"1. When user provides info above, call collect_{self.tool_name}(key, value)\n"
        instruction += "2. Extract naturally from conversation\n"
        instruction += "3. NEVER ask for ✅ ALREADY COLLECTED items\n"
        instruction += "4. Continue main conversation while collecting\n\n"

        instruction += "=" * 50 + "\n"

        return instruction


# ============================================
# 🆕 LOAD ALL TOOLS FOR AN ASSISTANT
# ============================================
async def load_all_tools(assistant_id: str) -> list:
    """Load ALL tool configurations for an assistant"""
    try:
        backend_url = (
            f"http://127.0.0.1:8000/api/v1/assistants/tool-config/{assistant_id}"
        )
        logger.info(f"📄 Loading all tools from: {backend_url}")

        async with aiohttp.ClientSession() as session:
            async with session.get(backend_url) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    if result.get("success"):
                        tools = result.get("data", [])

                        # Handle both single tool (old format) and array (new format)
                        if isinstance(tools, dict):
                            tools = [tools]  # Convert single tool to array
                        elif not isinstance(tools, list):
                            tools = []

                        logger.info(f"✅ Loaded {len(tools)} tool(s) for assistant")
                        for tool in tools:
                            logger.info(f"   • {tool.get('toolName')}")

                        return tools
                    else:
                        logger.warning(
                            f"⚠️ No tools found for assistant: {assistant_id}"
                        )
                        return []
                else:
                    logger.warning(f"⚠️ Failed to load tools, status: {resp.status}")
                    return []
    except Exception as e:
        logger.error(f"❌ Error loading tools: {e}")
        return []


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


def setup_langfuse(
    metadata: dict[str, AttributeValue] | None = None,
    *,
    host: str | None = None,
    public_key: str | None = None,
    secret_key: str | None = None,
) -> TracerProvider:
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    public_key = public_key or os.getenv("LANGFUSE_PUBLIC_KEY")
    secret_key = secret_key or os.getenv("LANGFUSE_SECRET_KEY")
    host = host or os.getenv("LANGFUSE_HOST")

    if not public_key or not secret_key or not host:
        logger.info("ℹ️ Langfuse not configured; skipping telemetry setup")
        return

    langfuse_auth = base64.b64encode(f"{public_key}:{secret_key}".encode()).decode()
    os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = f"{host.rstrip('/')}/api/public/otel"
    os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {langfuse_auth}"

    trace_provider = TracerProvider()
    trace_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    set_tracer_provider(trace_provider, metadata=metadata)
    return trace_provider


async def entrypoint(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {"room": ctx.room.name}

    # --- metadata extraction ---
    metadata = {}
    if hasattr(ctx.job, "metadata") and ctx.job.metadata:
        try:
            if isinstance(ctx.job.metadata, str):
                metadata = json.loads(ctx.job.metadata)
            else:
                metadata = ctx.job.metadata
        except (json.JSONDecodeError, TypeError):
            logger.warning("Failed to parse job metadata, using defaults")
            metadata = {}

    if not metadata and hasattr(ctx.room, "metadata") and ctx.room.metadata:
        try:
            if isinstance(ctx.room.metadata, str):
                metadata = json.loads(ctx.room.metadata)
            else:
                metadata = ctx.room.metadata or {}
        except (json.JSONDecodeError, TypeError):
            logger.warning("Failed to parse room metadata, using defaults")
            metadata = {}

    # Get dynamic parameters from metadata
    user_id = metadata.get("user_id")
    phone_number = metadata.get("phone_number")
    outbound_trunk_id = metadata.get("outbound_trunk_id")
    custom_instructions = metadata.get("instructions")
    custom_first_message = metadata.get(
        "first_message", "Hello! How can I help you today?"
    )
    realtime_provider_name = metadata.get("realtime_provider_name")
    llm_provider_name = metadata.get("llm_provider_name")
    stt_provider_name = metadata.get("stt_provider_name")
    tts_provider_name = metadata.get("tts_provider_name")
    llm_config = metadata.get("llm_config")
    realtime_model_config = metadata.get("realtime_model_config")
    stt_config = metadata.get("stt_config")
    tts_config = metadata.get("tts_config")
    assistant_id = metadata.get("assistant_id")
    webhook_url = metadata.get("webhook_url")  # Not used anymore (legacy)

    # Setup langfuse with metadata for tracing
    langfuse_metadata = {
        "langfuse.session.id": ctx.room.name,
        "langfuse.trace.name": f"Voice Agent Session - {ctx.room.name}",
    }

    # Add user_id to langfuse metadata if available
    if user_id:
        langfuse_metadata["langfuse.user.id"] = user_id

    # Add additional trace metadata for better observability
    if outbound_trunk_id:
        langfuse_metadata["langfuse.trace.metadata.outbound_trunk_id"] = (
            outbound_trunk_id
        )
    if phone_number:
        langfuse_metadata["langfuse.trace.metadata.phone_number"] = phone_number
    if stt_provider_name:
        langfuse_metadata["langfuse.trace.metadata.stt_provider"] = stt_provider_name
    if tts_provider_name:
        langfuse_metadata["langfuse.trace.metadata.tts_provider"] = tts_provider_name

    # Add environment if available
    environment = os.getenv("ENVIRONMENT", "production")
    langfuse_metadata["langfuse.environment"] = environment

    # Add version if available
    app_version = os.getenv("APP_VERSION", "1.0.0")
    langfuse_metadata["langfuse.version"] = app_version

    # Setup langfuse tracer with metadata
    trace_provider = setup_langfuse(metadata=langfuse_metadata)

    # Add a shutdown callback to flush the trace before process exit
    async def flush_trace():
        if trace_provider:
            try:
                trace_provider.force_flush()
                logger.info("✅ Metrics flushed successfully")
            except Exception as e:
                logger.error(f"❌ Error flushing metrics: {e}")

    ctx.add_shutdown_callback(flush_trace)

    logger.info("---------------------------------------------")
    logger.info("User Id: %s", user_id)
    logger.info("Outbound Trunk ID: %s", outbound_trunk_id)
    logger.info("Phone Number: %s", phone_number)
    logger.info("Custom instructions: %s", custom_instructions)
    logger.info("Custom first message: %s", custom_first_message)
    logger.info("Assistant ID: %s", assistant_id)
    logger.info("Realtime Provider Name: %s", realtime_provider_name)
    logger.info("STT Provider Name: %s", stt_provider_name)
    logger.info("TTS Provider Name: %s", tts_provider_name)
    logger.info("LLM Config: %s", llm_config)
    logger.info("Realtime Provider Config: %s", realtime_model_config)
    logger.info("STT Config: %s", stt_config)
    logger.info("TTS Config: %s", tts_config)
    logger.info("Langfuse metadata: %s", langfuse_metadata)
    logger.info("---------------------------------------------")

    # Read Azure credentials once if needed
    azure_speech_key = os.getenv("AZURE_SPEECH_KEY")
    azure_speech_region = os.getenv("AZURE_SPEECH_REGION")

    # 🆕 LOAD ALL TOOLS FOR THIS ASSISTANT
    tool_handlers = {}

    if assistant_id:
        logger.info("🔧 Loading all tools for assistant...")

        all_tools = await load_all_tools(assistant_id)

        if all_tools:
            logger.info(f"✅ Found {len(all_tools)} tool(s) for assistant")

            # Create handler for EACH tool
            for tool_config in all_tools:
                tool_name = tool_config.get("toolName")

                if tool_name:
                    # Create handler with metadata pre-population
                    handler = DynamicToolHandler(
                        tool_config=tool_config,
                        assistant_id=assistant_id,
                        metadata=metadata,
                    )

                    # Pre-populate from metadata
                    await handler.prepopulate_from_metadata()

                    tool_handlers[tool_name] = handler
                    logger.info(f"✅ Initialized handler for: {tool_name}")

                    # Log pre-populated data
                    if handler.collected_data:
                        logger.info(
                            f"   Pre-populated: {list(handler.collected_data.keys())}"
                        )
        else:
            logger.info("ℹ️ No tools configured for this assistant")
    else:
        logger.info("ℹ️ No assistant_id provided - tools disabled")

    # LLM selection
    llm = None
    if realtime_provider_name == "Gemini Realtime":
        voice = (realtime_model_config or {}).get("voice") or "Puck"
        logger.info("Realtime Voice: %s", voice)
        llm = google.realtime.RealtimeModel(
            model="gemini-2.5-flash-native-audio-preview-09-2025",
            voice=voice,
            temperature=0.8,
            instructions=custom_instructions,
        )
    elif llm_provider_name == "Groq":
        llm = groq.LLM(model="llama3-8b-8192")
    else:
        llm = openai.LLM(model="gpt-4.1-mini")

    # Set up STT provider based on metadata
    stt = None
    if stt_provider_name == "Sarvam":
        language_code = (stt_config or {}).get("language") or "en_IN"
        stt = sarvam.STT(language=language_code, model="saarika:v2.5")
    elif stt_provider_name == "Groq":
        language = (stt_config or {}).get("language") or "en"
        logger.info("Language: %s", language)
        stt = groq.STT(model="whisper-large-v3-turbo", language=language)
    elif stt_provider_name == "Azure":
        if not azure_speech_key or not azure_speech_region:
            logger.error(
                "Azure STT requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables"
            )
            raise ValueError("Missing Azure Speech credentials")
        logger.info("Azure STT Region: %s", azure_speech_region)
        stt = azure.STT(
            speech_key=azure_speech_key,
            speech_region=azure_speech_region,
        )
    else:
        stt = deepgram.STT(model="nova-3", language="multi")

    # Set up TTS provider
    tts = None
    if tts_provider_name == "Sarvam":
        speaker = (tts_config or {}).get("speaker") or "anushka"
        logger.info("Speaker: %s", speaker)
        language_code = (tts_config or {}).get("target_language_code") or "en_IN"
        logger.info("Language Code: %s", language_code)
        tts = sarvam.TTS(
            target_language_code=language_code, model="bulbul:v2", speaker=speaker
        )
    elif tts_provider_name == "Gemini":
        voice = (tts_config or {}).get("voice_name") or "Zephyr"
        instructions = (tts_config or {}).get(
            "instructions"
        ) or "Speak in a friendly and engaging tone."
        tts = google.beta.GeminiTTS(
            model="gemini-2.5-flash-preview-tts",
            voice_name=voice,
            instructions=instructions,
        )
    elif tts_provider_name == "Groq":
        voice = (tts_config or {}).get("voice") or "Arista-PlayAI"
        logger.info("Voice Name: %s", voice)
        tts = groq.TTS(
            model="playai-tts",
            voice=voice,
        )
    elif tts_provider_name == "Azure":
        if not azure_speech_key or not azure_speech_region:
            logger.error(
                "Azure TTS requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables"
            )
            raise ValueError("Missing Azure Speech credentials")
        logger.info("Azure TTS Region: %s", azure_speech_region)
        tts = azure.TTS(
            speech_key=azure_speech_key,
            speech_region=azure_speech_region,
        )
    elif tts_provider_name == "lmnt":
        model = (tts_config or {}).get("model") or "blizzard"
        logger.info("Model: %s", model)
        voice = (tts_config or {}).get("voice") or "leah"
        logger.info("Voice: %s", voice)
        language = (tts_config or {}).get("language") or "en"
        logger.info("Language: %s", language)
        temperature = (tts_config or {}).get("temperature") or 0.3
        logger.info("Temperature: %s", temperature)
        tts = lmnt.TTS(
            model=model,
            language=language,
            temperature=temperature,
            voice=voice,
        )
    else:
        tts = deepgram.TTS()

    # 🆕 Build final system prompt with ALL tool instructions
    final_instructions = custom_instructions or "You are a helpful AI assistant."

    if tool_handlers:
        logger.info(f"✅ Adding instructions for {len(tool_handlers)} tool(s)")

        for tool_name, handler in tool_handlers.items():
            tool_instructions = handler.get_tool_instructions()
            if tool_instructions:
                final_instructions += tool_instructions
                logger.info(f"✅ Added instructions for: {tool_name}")

    logger.info("=============================================")
    logger.info(
        "📋 Final Agent Instructions (first 500 chars):\n%s",
        (final_instructions[:500] + "...")
        if len(final_instructions) > 500
        else final_instructions,
    )
    logger.info("=============================================")

    # 🆕 Create function for EACH tool
    tool_functions = []

    for tool_name, handler in tool_handlers.items():
        params = handler.tool_config.get("parameters", {})
        param_list = list(params.keys())
        required = [k for k, v in params.items() if v.get("required")]

        collect_description = (
            f"[{tool_name}] Store user information. "
            f"Call when user provides: {', '.join(param_list)}. "
            f"Required: {', '.join(required)}."
        )

        # Create unique function for THIS tool
        # We need to capture 'handler' in closure properly
        def make_tool_function(tool_handler, fn_name, description):
            @agent_llm.function_tool(name=fn_name, description=description)
            async def tool_function(key: str, value: str):
                """Store user-provided information for this tool"""
                logger.info(
                    f"🔧 [{fn_name}] collect_data(key='{key}', value='{value}')"
                )
                await tool_handler.collect_data(key, value)

                logger.info(
                    f"📊 [{fn_name}] Current data: {json.dumps(tool_handler.collected_data, indent=2)}"
                )

                missing = tool_handler.get_missing_parameters()
                if missing:
                    return f"✅ Stored {key}. Still need: {', '.join(missing)}"
                else:
                    return f"✅ Stored {key}. All required information collected!"

            return tool_function

        # Create function with unique name for each tool
        tool_func = make_tool_function(
            handler, f"collect_{tool_name}", collect_description
        )
        tool_functions.append(tool_func)
        logger.info(f"✅ Registered function: collect_{tool_name}")

    # Set up a voice AI pipeline using the configured provider
    session = None
    if realtime_provider_name == None:
        session = AgentSession(
            llm=llm,
            stt=stt,
            tts=tts,
            vad=ctx.proc.userdata["vad"],
            preemptive_generation=True,
        )
    else:
        session = AgentSession(llm=llm)

    @session.on("agent_false_interruption")
    def _on_agent_false_interruption(ev: AgentFalseInterruptionEvent):
        logger.info("false positive interruption, resuming")
        session.generate_reply(instructions=ev.extra_instructions or NOT_GIVEN)

    # 🆕 Track conversation for summaries (works for both standard and realtime models)
    @session.on("agent_started_speaking")
    def _on_agent_started_speaking(ev):
        logger.info(f"🤖 AGENT STARTED SPEAKING")

    @session.on("user_started_speaking")
    def _on_user_started_speaking(ev):
        logger.info(f"🎙️ USER STARTED SPEAKING")

    # Track via agent state changes (more reliable for realtime)
    @session.on("agent_state_changed")
    def _on_agent_state_changed(ev):
        logger.info(f"🔄 AGENT STATE: {ev.old_state} -> {ev.new_state}")

    # Track conversation items for transcript building
    @session.on("conversation_item_added")
    def _on_conversation_item_added(ev):
        try:
            item = ev.item
            role = "User" if item.role == "user" else "Assistant"
            content = (
                item.text_content
                if hasattr(item, "text_content")
                else str(item.content)
            )

            if content:
                for handler in tool_handlers.values():
                    # Only add if not already in transcript
                    if (
                        not handler.transcript
                        or handler.transcript[-1] != f"{role}: {content}"
                    ):
                        asyncio.create_task(handler.add_to_transcript(role, content))
                        logger.info(
                            f"📝 Added to transcript: {role}: {content[:50]}..."
                        )
        except Exception as e:
            logger.error(f"Error processing conversation item: {e}")

    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # Pass tools to Agent constructor
    if tool_functions:
        agent = Agent(
            instructions=final_instructions,
            tools=tool_functions,
        )
        logger.info(f"✅ Created Agent with {len(tool_functions)} tool(s)")
    else:
        agent = Agent(instructions=final_instructions)
        logger.info("ℹ️ Created Agent without tools")

    # Start session with the agent that has tools
    await session.start(
        agent=agent, room=ctx.room, room_input_options=RoomInputOptions()
    )

    logger.info("✅ Voice session started successfully")

    # 🆕 CRITICAL: Send ALL webhooks when call ends
    # 🆕 CRITICAL: Send ALL webhooks when call ends (in parallel)
    async def send_all_webhooks():
        if not tool_handlers:
            logger.info("ℹ️ No tool handlers configured - skipping webhooks")
            return

        logger.info(f"📞 Call ending - processing {len(tool_handlers)} webhook(s)...")
        tasks = []

        for tool_name, handler in tool_handlers.items():
            # Check if we have data or parameters defined
            if handler.collected_data or (
                handler.tool_config and handler.tool_config.get("parameters")
            ):
                logger.info(f"⏳ Initializing final webhook task for: {tool_name}")
                tasks.append(handler.send_to_webhook(is_final=True))
            else:
                logger.info(f"ℹ️ No data to send for: {tool_name}")

        if tasks:
            logger.info(f"🚀 Sending {len(tasks)} webhooks in parallel...")
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for i, result in enumerate(results):
                tool_name = list(tool_handlers.keys())[i]
                if isinstance(result, Exception):
                    logger.error(f"❌ Webhook task failed for {tool_name}: {result}")
                elif result is True:
                    logger.info(f"✅ Webhook sent successfully for: {tool_name}")
                else:
                    logger.warning(
                        f"⚠️ Webhook process finished with failure for: {tool_name}"
                    )
        else:
            logger.info("ℹ️ No active tool data to send")

    ctx.add_shutdown_callback(send_all_webhooks)

    # Join the room and connect to the user
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Kick off conversation
    await session.generate_reply(
        instructions=f"Start the conversation by saying: '{custom_first_message}'"
    )

    logger.info("✅ Voice session active; waiting for events")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="hexite-outbound-caller",
        )
    )
