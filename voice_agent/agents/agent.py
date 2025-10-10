import json
import logging

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
from livekit.plugins import deepgram, elevenlabs, noise_cancellation, openai, silero

logger = logging.getLogger("agent")

load_dotenv(".env", override=True)


class Assistant(Agent):
    def __init__(self, instructions: str | None = None) -> None:
        default_instructions = """You are a helpful voice AI assistant.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            You are curious, friendly, and have a sense of humor."""

        super().__init__(
            instructions=instructions if instructions is not None else default_instructions,
        )


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Extract metadata from the job context
    metadata = {}
    # Check if we have job metadata available
    if hasattr(ctx.job, 'metadata') and ctx.job.metadata:
        try:
            if isinstance(ctx.job.metadata, str):
                metadata = json.loads(ctx.job.metadata)
            else:
                metadata = ctx.job.metadata
        except (json.JSONDecodeError, TypeError):
            logger.warning("Failed to parse job metadata, using defaults")
            metadata = {}

    # Also check room metadata as fallback
    if not metadata and hasattr(ctx.room, 'metadata') and ctx.room.metadata:
        try:
            if isinstance(ctx.room.metadata, str):
                metadata = json.loads(ctx.room.metadata)
            else:
                metadata = ctx.room.metadata or {}
        except (json.JSONDecodeError, TypeError):
            logger.warning("Failed to parse room metadata, using defaults")
            metadata = {}

    # Get dynamic parameters from metadata
    custom_instructions = metadata.get('instructions')
    custom_first_message = metadata.get('first_message', "Hello! How can I help you today?")
    logger.info("---------------------------------------------")
    logger.info("Custom instructions: %s", custom_instructions)
    logger.info("Custom first message: %s", custom_first_message)
    logger.info("---------------------------------------------")
    # Set up a voice AI pipeline using OpenAI, Cartesia, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        llm=openai.LLM(model="gpt-4.1-mini"),
        stt=deepgram.STT(model="nova-3", language="multi"),
        #tts=deepgram.TTS(),
        tts=elevenlabs.TTS(voice_id="0icWottL1L2MsAigrUBg"),
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

    await session.generate_reply(instructions=f"Start the conversation by saying: '{custom_first_message}'")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="hexite-outbound-caller",
        )
    )
