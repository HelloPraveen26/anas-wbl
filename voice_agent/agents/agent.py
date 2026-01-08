import asyncio
import base64
import json
import logging
import os
import time

from dotenv import load_dotenv
from livekit import api, rtc
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
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
    get_job_context,
    metrics,
)
from livekit.agents.telemetry import set_tracer_provider
from livekit.plugins import (
    azure,
    deepgram,
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

load_dotenv(".env", override=True)


async def hangup_call():
    """Hang up the call by deleting the room for all participants."""
    ctx = get_job_context()
    if ctx is None:
        logger.warning("Cannot hang up: not running in a job context")
        return

    logger.info(f"Hanging up call for room: {ctx.room.name}")
    await ctx.api.room.delete_room(
        api.DeleteRoomRequest(
            room=ctx.room.name,
        )
    )


class Assistant(Agent):
    def __init__(self, instructions: str | None = None) -> None:
        default_instructions = """You are a helpful voice AI assistant.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            If the user clearly wants to end the conversation, call the end_call function.
            You are curious, friendly, and have a sense of humor."""

        super().__init__(
            instructions=instructions
            if instructions is not None
            else default_instructions,
        )

    @function_tool
    async def end_call(self, ctx: RunContext):
        """Called when the user wants to end the call"""
        await ctx.wait_for_playout()
        logger.info("User requested to end the call")
        # Try to say goodbye message before shutting down
        # Strategy: Try session.say() first (works for TTS-based models)
        # If that fails, try generate_reply() for realtime models
        goodbye_said = False

        # First, try session.say() - works for STT-LLM-TTS pipeline and realtime models with TTS (Gemini Realtime)
        try:
            goodbye_handle = await ctx.session.say(
                "Thank you for calling. Have a great day! Goodbye!",
                allow_interruptions=False,
            )
            # Wait for the goodbye message to finish playing
            await goodbye_handle.wait_for_playout()
            goodbye_said = True
            logger.info(
                "Goodbye message delivered via session.say(), session is now closing."
            )
        except Exception:
            logger.debug(
                "trying generate_reply() as fallback for realtime models without TTS"
            )
            try:
                goodbye_handle = await asyncio.wait_for(
                    ctx.session.generate_reply(
                        instructions="Say a brief, friendly goodbye message like 'Thank you for calling. Have a great day! Goodbye!'",
                    ),
                    timeout=3.0,  # Short timeout to avoid blocking
                )
                # Wait for the goodbye message to finish playing (with timeout)
                try:
                    await asyncio.wait_for(
                        goodbye_handle.wait_for_playout(), timeout=3.0
                    )
                    goodbye_said = True
                    logger.info("Goodbye message delivered via generate_reply()")
                except asyncio.TimeoutError:
                    logger.warning(
                        "Goodbye message playout timeout, proceeding with shutdown"
                    )
            except asyncio.TimeoutError:
                logger.warning(
                    "Goodbye message generation timeout, proceeding with shutdown"
                )
            except Exception as e2:
                logger.warning(
                    f"Could not say goodbye message via either method: {e2}, proceeding with shutdown"
                )

        if not goodbye_said:
            logger.info("Proceeding with shutdown without goodbye message")

        # Shutdown the session gracefully - this will close the session and disconnect the agent
        ctx.session.shutdown(drain=True)
        # Delete the room to disconnect all participants
        job_ctx = get_job_context()
        if job_ctx:
            logger.info(f"Deleting room: {job_ctx.room.name}")
            await job_ctx.delete_room()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def _wait_for_participant(room: rtc.Room, timeout: float = 10.0):
    """Wait for a remote participant to connect"""
    if room.remote_participants:
        logger.info("Participant already connected")
        return

    logger.info("Waiting for participant to connect...")
    future = asyncio.Future()

    def _on_participant_connected(p: rtc.RemoteParticipant):
        if not future.done():
            logger.info(f"Participant connected: {p.identity}")
            future.set_result(None)

    room.on("participant_connected", _on_participant_connected)

    # Check again in case participant connected between check and event handler setup
    if room.remote_participants:
        if not future.done():
            future.set_result(None)
        return

    try:
        await asyncio.wait_for(future, timeout=timeout)
        logger.info("Participant connection confirmed")
    except asyncio.TimeoutError:
        logger.warning(f"Timeout waiting for participant to connect after {timeout}s")
        # Continue anyway - the participant might connect later


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
        raise ValueError(
            "LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, and LANGFUSE_HOST must be set"
        )

    langfuse_auth = base64.b64encode(f"{public_key}:{secret_key}".encode()).decode()
    os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = f"{host.rstrip('/')}/api/public/otel"
    os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {langfuse_auth}"

    trace_provider = TracerProvider()
    trace_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    set_tracer_provider(trace_provider, metadata=metadata)
    return trace_provider


async def entrypoint(ctx: JobContext):
    entrypoint_start = time.time()
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Connect first - this is fast
    connect_start = time.time()
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connection established in {time.time() - connect_start:.2f}s")

    # Parse metadata quickly
    metadata_start = time.time()
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

    # Also check room metadata as fallback
    if not metadata and hasattr(ctx.room, "metadata") and ctx.room.metadata:
        try:
            if isinstance(ctx.room.metadata, str):
                metadata = json.loads(ctx.room.metadata)
            else:
                metadata = ctx.room.metadata or {}
        except (json.JSONDecodeError, TypeError):
            logger.warning("Failed to parse room metadata, using defaults")
            metadata = {}
    logger.info(f"Metadata parsed in {time.time() - metadata_start:.2f}s")

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

    # Prepare langfuse metadata (but setup will be done asynchronously)
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

    # Setup langfuse asynchronously (non-blocking)
    async def setup_langfuse_async():
        try:
            trace_provider = setup_langfuse(metadata=langfuse_metadata)

            async def flush_trace():
                trace_provider.force_flush()

            ctx.add_shutdown_callback(flush_trace)
        except Exception as e:
            logger.warning(f"Failed to setup langfuse: {e}")

    # Start langfuse setup in background
    asyncio.create_task(setup_langfuse_async())

    logger.info("---------------------------------------------")
    logger.info("User Id: %s", user_id)
    logger.info("Outbound Trunk ID: %s", outbound_trunk_id)
    logger.info("Phone Number: %s", phone_number)
    logger.info("Custom instructions: %s", custom_instructions)
    logger.info("Custom first message: %s", custom_first_message)
    logger.info("Realtime Provider Name: %s", realtime_provider_name)
    logger.info("STT Provider Name: %s", stt_provider_name)
    logger.info("TTS Provider Name: %s", tts_provider_name)
    logger.info("LLM Config: %s", llm_config)
    logger.info("Realtime Provider Config: %s", realtime_model_config)
    logger.info("STT Config: %s", stt_config)
    logger.info("TTS Config: %s", tts_config)
    logger.info("Langfuse metadata: %s", langfuse_metadata)
    logger.info("---------------------------------------------")

    # Initialize models - try to parallelize where possible
    models_start = time.time()

    # Read Azure credentials once if needed
    azure_speech_key = os.getenv("AZURE_SPEECH_KEY")
    azure_speech_region = os.getenv("AZURE_SPEECH_REGION")

    # LLM factory functions
    def _create_gemini_realtime_llm():
        voice = (realtime_model_config or {}).get("voice") or "Puck"
        logger.info("Realtime Voice: %s", voice)
        model = (realtime_model_config or {}).get(
            "model"
        ) or "gemini-2.5-flash-native-audio-preview-12-2025"
        logger.info("Realtime Model: %s", model)
        return google.realtime.RealtimeModel(
            model=model,
            voice=voice,
            temperature=0.4,
            instructions=custom_instructions,
        )

    def _create_groq_llm():
        return groq.LLM(model="llama3-8b-8192")

    def _create_openai_llm():
        return openai.LLM(model="gpt-4.1-mini")

    # STT factory functions
    def _create_sarvam_stt():
        language_code = (stt_config or {}).get("language") or "en_IN"
        logger.info("Language Code: %s", language_code)
        return sarvam.STT(language=language_code, model="saarika:v2.5")

    def _create_groq_stt():
        language = (stt_config or {}).get("language") or "en"
        logger.info("Language: %s", language)
        return groq.STT(model="whisper-large-v3-turbo", language=language)

    def _create_azure_stt():
        if not azure_speech_key or not azure_speech_region:
            logger.error(
                "Azure STT requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables"
            )
            raise ValueError("Missing Azure Speech credentials")
        logger.info("Azure STT Region: %s", azure_speech_region)
        return azure.STT(
            speech_key=azure_speech_key,
            speech_region=azure_speech_region,
        )

    def _create_deepgram_stt():
        return deepgram.STT(model="nova-3", language="multi")

    # TTS factory functions
    def _create_sarvam_tts():
        speaker = (tts_config or {}).get("speaker") or "anushka"
        logger.info("Speaker: %s", speaker)
        language_code = (tts_config or {}).get("target_language_code") or "en_IN"
        logger.info("Language Code: %s", language_code)
        return sarvam.TTS(
            target_language_code=language_code, model="bulbul:v2", speaker=speaker
        )

    def _create_gemini_tts():
        voice = (tts_config or {}).get("voice_name") or "Zephyr"
        logger.info("Voice Name: %s", voice)
        instructions = (tts_config or {}).get(
            "instructions"
        ) or "Speak in a friendly and engaging tone."
        logger.info("Instructions: %s", instructions)
        return google.beta.GeminiTTS(
            model="gemini-2.5-flash-preview-tts",
            voice_name=voice,
            instructions=instructions,
        )

    def _create_groq_tts():
        voice = (tts_config or {}).get("voice") or "Arista-PlayAI"
        logger.info("Voice Name: %s", voice)
        return groq.TTS(model="playai-tts", voice=voice)

    def _create_azure_tts():
        if not azure_speech_key or not azure_speech_region:
            logger.error(
                "Azure TTS requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables"
            )
            raise ValueError("Missing Azure Speech credentials")
        logger.info("Azure TTS Region: %s", azure_speech_region)
        return azure.TTS(
            speech_key=azure_speech_key,
            speech_region=azure_speech_region,
        )

    def _create_lmnt_tts():
        model = (tts_config or {}).get("model") or "blizzard"
        logger.info("Model: %s", model)
        voice = (tts_config or {}).get("voice") or "leah"
        logger.info("Voice: %s", voice)
        language = (tts_config or {}).get("language") or "en"
        logger.info("Language: %s", language)
        temperature = (tts_config or {}).get("temperature") or 0.3
        logger.info("Temperature: %s", temperature)
        return lmnt.TTS(
            model=model,
            language=language,
            temperature=temperature,
            voice=voice,
        )

    def _create_deepgram_tts():
        return deepgram.TTS()

    # Provider factory mappings
    LLM_FACTORIES = {
        "Gemini Realtime": _create_gemini_realtime_llm,
        "Groq": _create_groq_llm,
    }
    LLM_DEFAULT = _create_openai_llm

    STT_FACTORIES = {
        "Sarvam": _create_sarvam_stt,
        "Groq": _create_groq_stt,
        "Azure": _create_azure_stt,
    }
    STT_DEFAULT = _create_deepgram_stt

    TTS_FACTORIES = {
        "Sarvam": _create_sarvam_tts,
        "Gemini": _create_gemini_tts,
        "Groq": _create_groq_tts,
        "Azure": _create_azure_tts,
        "lmnt": _create_lmnt_tts,
    }
    TTS_DEFAULT = _create_deepgram_tts

    # Helper functions for model initialization
    async def _init_llm():
        llm_start = time.time()
        # Check realtime_provider_name first (for "Gemini Realtime"), then llm_provider_name (for "Groq")
        provider = realtime_provider_name or llm_provider_name
        factory = LLM_FACTORIES.get(provider) if provider else None
        llm = factory() if factory else LLM_DEFAULT()
        logger.info(f"LLM initialized in {time.time() - llm_start:.2f}s")
        return llm

    async def _init_stt():
        stt_start = time.time()
        factory = STT_FACTORIES.get(stt_provider_name) if stt_provider_name else None
        stt = factory() if factory else STT_DEFAULT()
        logger.info(f"STT initialized in {time.time() - stt_start:.2f}s")
        return stt

    async def _init_tts():
        tts_start = time.time()
        factory = TTS_FACTORIES.get(tts_provider_name) if tts_provider_name else None
        tts = factory() if factory else TTS_DEFAULT()
        logger.info(f"TTS initialized in {time.time() - tts_start:.2f}s")
        return tts

    # Initialize models in parallel where possible
    if realtime_provider_name is None:
        # For STT-LLM-TTS pipeline, initialize all three in parallel
        llm, stt, tts = await asyncio.gather(
            _init_llm(),
            _init_stt(),
            _init_tts(),
        )
    else:
        # For realtime models, only initialize LLM
        llm = await _init_llm()
        stt = None
        tts = None

    logger.info(f"All models initialized in {time.time() - models_start:.2f}s")

    # Set up a voice AI pipeline using the configured provider
    session = None
    if realtime_provider_name is None:
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

    # Start the session, which initializes the voice pipeline and warms up the models
    session_start_init = time.time()
    await session.start(
        agent=Assistant(instructions=custom_instructions),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            close_on_disconnect=True,
        ),
    )
    logger.info(f"Session started in {time.time() - session_start_init:.2f}s")

    # Wait for SIP participant to connect before generating first message
    participant_wait_start = time.time()
    await _wait_for_participant(ctx.room, timeout=10.0)
    logger.info(
        f"Participant wait completed in {time.time() - participant_wait_start:.2f}s"
    )

    # Generate first message
    first_message_start = time.time()
    await session.generate_reply(
        instructions=f"Start the conversation by saying: '{custom_first_message}'"
    )
    logger.info(f"First message generated in {time.time() - first_message_start:.2f}s")

    total_time = time.time() - entrypoint_start
    logger.info(f"Total entrypoint time: {total_time:.2f}s")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="hexite-outbound-caller",
        )
    )
