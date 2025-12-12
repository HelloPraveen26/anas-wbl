import base64
import json
import logging
import os

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
from livekit.agents.inference.tts import TTSEncoding
from livekit.agents.telemetry import set_tracer_provider
from livekit.plugins import (
    azure,
    deepgram,
    elevenlabs,
    google,
    noise_cancellation,
    openai,
    sarvam,
    silero,
)
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.util.types import AttributeValue

logger = logging.getLogger("agent")

load_dotenv(".env", override=True)


class Assistant(Agent):
    def __init__(self, instructions: str | None = None) -> None:
        default_instructions = """You are a helpful voice AI assistant.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            You are curious, friendly, and have a sense of humor."""

        super().__init__(
            instructions=instructions
            if instructions is not None
            else default_instructions,
        )


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
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Extract metadata from the job context
    metadata = {}
    # Check if we have job metadata available
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

    # Get dynamic parameters from metadata
    user_id = metadata.get("user_id")
    phone_number = metadata.get("phone_number")
    outbound_trunk_id = metadata.get("outbound_trunk_id")
    custom_instructions = metadata.get("instructions")
    custom_first_message = metadata.get(
        "first_message", "Hello! How can I help you today?"
    )
    stt_provider_name = metadata.get("stt_provider_name")
    tts_provider_name = metadata.get("tts_provider_name")
    stt_config = metadata.get("stt_config")
    tts_config = metadata.get("tts_config")

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
        langfuse_metadata["langfuse.trace.metadata.outbound_trunk_id"] = outbound_trunk_id
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
    logger.info("STT Provider Name: %s", stt_provider_name)
    logger.info("TTS Provider Name: %s", tts_provider_name)
    logger.info("STT Config: %s", stt_config)
    logger.info("TTS Config: %s", tts_config)
    logger.info("Langfuse metadata: %s", langfuse_metadata)
    logger.info("---------------------------------------------")

    # Read Azure credentials once if needed
    azure_speech_key = os.getenv("AZURE_SPEECH_KEY")
    azure_speech_region = os.getenv("AZURE_SPEECH_REGION")

    # Set up STT provider based on metadata
    stt = None
    if stt_provider_name == "Sarvam":
        language_code = (stt_config or {}).get("language") or "en_IN"
        logger.info("Language Code: %s", language_code)
        stt = sarvam.STT(language=language_code, model="saarika:v2.5")
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

    # Set up TTS provider based on metadata
    tts = None
    if tts_provider_name == "Sarvam":
        speaker = (tts_config or {}).get("speaker") or "anushka"
        logger.info("Speaker: %s", speaker)
        language_code = (stt_config or {}).get("language") or "en_IN"
        logger.info("Language Code: %s", language_code)
        tts = sarvam.TTS(
            target_language_code=language_code, model="bulbul:v2", speaker=speaker
        )
    elif tts_provider_name == "Gemini":
        voice = (tts_config or {}).get("voice_name") or "Zephyr"
        logger.info("Voice Name: %s", voice)
        instructions = (tts_config or {}).get(
            "instructions"
        ) or "Speak in a friendly and engaging tone."
        logger.info("Instructions: %s", instructions)
        tts = google.beta.GeminiTTS(
            model="gemini-2.5-flash-preview-tts",
            voice_name=voice,
            instructions=instructions,
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
    else:
        tts = deepgram.TTS()

    # Set up a voice AI pipeline using OpenAI, Cartesia, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        llm=openai.LLM(model="gpt-4.1-mini"),
        stt=stt,
        tts=tts,
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

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
    await session.start(
        agent=Assistant(instructions=custom_instructions),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
            close_on_disconnect=True,
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()

    await session.generate_reply(
        instructions=f"Start the conversation by saying: '{custom_first_message}'"
    )


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="hexite-outbound-caller",
        )
    )
