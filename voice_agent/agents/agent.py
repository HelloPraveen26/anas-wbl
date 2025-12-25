# agent.py  (FIXED VERSION - Tools properly passed to Agent)
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
    noise_cancellation,
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
# DynamicToolHandler
# -------------------------------------
class DynamicToolHandler:
    """Handles dynamic tool configuration and data collection"""

    def __init__(self, webhook_url: str, assistant_id: str):
        self.webhook_url = webhook_url
        self.assistant_id = assistant_id
        self.collected_data = {}
        self.tool_config = None

    async def load_tool_config(self):
        """Load tool configuration from backend"""
        try:
            backend_url = f"http://127.0.0.1:8000/api/v1/assistants/tool-config/{self.assistant_id}"

            logger.info(f"ðŸ”„ Loading tool config from: {backend_url}")

            async with aiohttp.ClientSession() as session:
                async with session.get(backend_url) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        if result.get("success") and result.get("data"):
                            self.tool_config = result["data"]
                            logger.info(
                                f"âœ… Loaded tool config: {self.tool_config.get('toolName')}"
                            )
                            logger.info(
                                f"ðŸ“‹ Parameters: {list(self.tool_config.get('parameters', {}).keys())}"
                            )
                            return True
                        else:
                            logger.warning(
                                f"âš ï¸ No tool config found for assistant: {self.assistant_id}"
                            )
                            return False
                    else:
                        logger.warning(
                            f"âš ï¸ Failed to load config, status: {resp.status}"
                        )
                        return False
        except Exception as e:
            logger.error(f"âŒ Error loading tool config: {e}")
            return False

    async def collect_data(self, key: str, value: str):
        """Store user-provided information"""
        self.collected_data[key] = value
        logger.info(f"âœ… [TOOL STORED] {key}: {value}")
        logger.info(f"ðŸ“Š Current data: {json.dumps(self.collected_data, indent=2)}")

        # When all required parameters are collected, forward to backend.
        if self.all_required_collected():
            logger.info(
                "âœ… All required parameters collected! Auto-sending to webhook..."
            )
            await self.send_to_webhook()

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

    def all_required_collected(self):
        """Check if all required parameters have been collected"""
        if not self.tool_config:
            return True

        params = self.tool_config.get("parameters", {})

        for param_name, param_config in params.items():
            if param_config.get("required", False):
                if param_name not in self.collected_data:
                    logger.info(f"â³ Still missing required parameter: {param_name}")
                    return False

        return True

    async def send_to_webhook(self):
        """Send collected data to backend, which forwards to the configured webhook"""
        try:
            backend_url = "http://127.0.0.1:8000/api/v1/assistants/agent-webhook"
            payload = {
                "assistantId": self.assistant_id,
                "collectedData": self.collected_data,
            }

            logger.info("=============================================")
            logger.info(f"ðŸ“¤ Sending collected data to backend")
            logger.info(f"ðŸ†” Assistant ID: {self.assistant_id}")
            logger.info(f"ðŸ“Š Data: {json.dumps(self.collected_data, indent=2)}")
            logger.info("=============================================")

            async with aiohttp.ClientSession() as session:
                async with session.post(backend_url, json=payload) as resp:
                    text = await resp.text()
                    if resp.status == 200:
                        logger.info(f"âœ… Data sent successfully to backend (200)")
                        logger.info(f"ðŸ” Backend response: {text}")
                        return True
                    else:
                        logger.error(
                            f"âŒ Backend returned status: {resp.status}, response: {text}"
                        )
                        return False
        except Exception as e:
            logger.error(f"âŒ Failed to send to backend webhook: {e}")
            return False

    def get_tool_instructions(self):
        """Generate additional instructions for data collection (appended to system prompt)"""
        if not self.tool_config:
            return ""

        params = self.tool_config.get("parameters", {})
        if not params:
            return ""

        # Get required and optional parameters with descriptions
        required_params = []
        optional_params = []

        for param_name, param_config in params.items():
            param_desc = param_config.get("description", param_name)
            param_type = param_config.get("type", "string")

            if param_config.get("required", False):
                required_params.append(f"{param_name} ({param_type}): {param_desc}")
            else:
                optional_params.append(f"{param_name} ({param_type}): {param_desc}")

        instruction = "\n\n" + "=" * 50 + "\n"
        instruction += "ðŸ”§ DATA COLLECTION TOOL ACTIVATED\n"
        instruction += "=" * 50 + "\n\n"

        instruction += "YOUR PRIMARY MISSION: Collect the following information during this conversation.\n\n"

        if required_params:
            instruction += "âœ… REQUIRED INFORMATION (must collect all):\n"
            for i, param in enumerate(required_params, 1):
                instruction += f"   {i}. {param}\n"
            instruction += "\n"

        if optional_params:
            instruction += "ðŸ“‹ OPTIONAL INFORMATION (collect if mentioned):\n"
            for i, param in enumerate(optional_params, 1):
                instruction += f"   {i}. {param}\n"
            instruction += "\n"

        instruction += "ðŸŽ¯ CRITICAL RULES:\n"
        instruction += "1. When user provides ANY piece of information above, IMMEDIATELY call collect_user_data(key, value)\n"
        instruction += "2. Extract information naturally from conversation - don't make it feel like an interrogation\n"
        instruction += "3. Ask follow-up questions conversationally to get missing required information\n"
        instruction += "4. If user provides multiple pieces at once, call collect_user_data separately for each\n"
        instruction += "5. The system will automatically send data to webhook once all required fields are collected\n"
        instruction += (
            "6. Continue your main conversation purpose while collecting this data\n\n"
        )

        instruction += "ðŸ’¡ EXAMPLES:\n"
        instruction += "User: 'Hi, I'm John Smith from ABC Corp'\n"
        instruction += "â†’ Call collect_user_data('name', 'John Smith')\n"
        instruction += "â†’ Call collect_user_data('company', 'ABC Corp')\n"
        instruction += "â†’ Then respond naturally: 'Great to meet you John! What can I help you with today?'\n\n"

        instruction += "User: 'My email is john@example.com'\n"
        instruction += "â†’ Call collect_user_data('email', 'john@example.com')\n"
        instruction += "â†’ Then continue conversation\n\n"

        instruction += "=" * 50 + "\n"

        return instruction


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
        logger.info("â„¹ï¸ Langfuse not configured; skipping telemetry setup")
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
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

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
    webhook_url = metadata.get("webhook_url")

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
        trace_provider.force_flush()

    ctx.add_shutdown_callback(flush_trace)

    logger.info("---------------------------------------------")
    logger.info("User Id: %s", user_id)
    logger.info("Outbound Trunk ID: %s", outbound_trunk_id)
    logger.info("Phone Number: %s", phone_number)
    logger.info("Custom instructions: %s", custom_instructions)
    logger.info("Custom first message: %s", custom_first_message)
    logger.info("Assistant ID: %s", assistant_id)
    logger.info("Webhook URL: %s", webhook_url)
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
    # Initialize tool handler BEFORE setting up STT/TTS
    tool_handler = None
    if assistant_id and webhook_url:
        logger.info("ðŸ”§ Initializing tool handler...")
        tool_handler = DynamicToolHandler(webhook_url, assistant_id)
        config_loaded = await tool_handler.load_tool_config()

        if config_loaded:
            logger.info("âœ… Tool configuration loaded successfully")
            logger.info(
                f"ðŸ“‹ Tool will collect: {list(tool_handler.tool_config.get('parameters', {}).keys())}"
            )
        else:
            logger.warning(
                "âš ï¸ No tool configuration found - agent will work without data collection"
            )
            tool_handler = None

    # STT / TTS selection
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

    # Build final system prompt and append tool instructions if present
    final_instructions = custom_instructions or "You are a helpful AI assistant."
    if tool_handler and tool_handler.tool_config:
        tool_instructions = tool_handler.get_tool_instructions()
        if tool_instructions:
            final_instructions += tool_instructions
            logger.info("âœ… Added data collection instructions to system prompt")

    logger.info("=============================================")
    logger.info(
        "ðŸ“‹ Final Agent Instructions (first 500 chars):\n%s",
        (final_instructions[:500] + "...")
        if len(final_instructions) > 500
        else final_instructions,
    )
    logger.info("=============================================")

    # --- CRITICAL FIX: Create tool function and pass it to Agent (not LLM) ---
    tool_functions = []

    if tool_handler and tool_handler.tool_config:
        params = tool_handler.tool_config.get("parameters", {})
        param_list = list(params.keys())
        required = [k for k, v in params.items() if v.get("required")]
        optional = [k for k, v in params.items() if not v.get("required")]

        collect_description = (
            f"Store user information. Call this IMMEDIATELY when user provides any of: {', '.join(param_list)}. "
            f"Required: {', '.join(required)}. Optional: {', '.join(optional)}."
        )

        # Create the tool function with proper decorator
        @agent_llm.function_tool(
            name="collect_user_data", description=collect_description
        )
        async def collect_user_data(key: str, value: str):
            """
            Store user-provided information.

            Args:
                key: The parameter name (e.g., 'name', 'email', 'phone')
                value: The value provided by the user
            """
            logger.info(
                f"ðŸ”§ [TOOL CALLED] collect_user_data(key='{key}', value='{value}')"
            )
            if tool_handler:
                await tool_handler.collect_data(key, value)
                missing = tool_handler.get_missing_parameters()
                if missing:
                    return f"âœ… Stored {key}. Still need: {', '.join(missing)}"
                else:
                    return f"âœ… Stored {key}. All required information collected!"
            return f"âœ… Stored {key}"

        tool_functions.append(collect_user_data)
        logger.info("âœ… Registered collect_user_data tool function")

    session = AgentSession(
        llm=llm,
        stt=stt,
        tts=tts,
        vad=ctx.proc.userdata.get("vad"),
        preemptive_generation=True,
    )
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

    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # CRITICAL FIX: Pass tools to Agent constructor, not to LLM
    if tool_functions:
        agent = Agent(
            instructions=final_instructions,
            tools=tool_functions,  # â† Pass tools here to Agent
        )
        logger.info(f"âœ… Created Agent with {len(tool_functions)} tool(s)")
    else:
        agent = Agent(instructions=final_instructions)
        logger.info("â„¹ï¸ Created Agent without tools")

    # Start session with the agent that has tools
    await session.start(
        agent=agent, room=ctx.room, room_input_options=RoomInputOptions()
    )

    logger.info("âœ… Voice session started successfully with tools enabled")

    # Kick off conversation
    await session.generate_reply(
        instructions=f"Start the conversation by saying: '{custom_first_message}'"
    )

    logger.info("âœ… Voice session active; waiting for events")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="hexite-outbound-caller",
        )
    )
