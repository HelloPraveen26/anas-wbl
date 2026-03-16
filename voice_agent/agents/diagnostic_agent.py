
import asyncio
import logging
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
)
from livekit.plugins import silero, google

logger = logging.getLogger("diagnostic-agent")

async def entrypoint(ctx: JobContext):
    logger.info(f"Starting diagnostic for room: {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Trace tracks
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.TrackPublication, participant: rtc.RemoteParticipant):
        logger.info(f"Subscribed to {participant.identity}'s {track.kind} track")

    # Wait for participant
    while not ctx.room.remote_participants:
        logger.info("Waiting for participant...")
        await asyncio.sleep(1)
    
    logger.info(f"Participant detected: {list(ctx.room.remote_participants.keys())}")
    
    # Initialize model
    model = google.realtime.RealtimeModel(
        model="gemini-2.4-flash-native-audio-preview-12-2025", # Try the newer one
        voice="Puck",
        instructions="You are a test agent. Say 'System check passed. I am speaking.' and then wait."
    )
    
    session = AgentSession(llm=model)
    
    @session.on("agent_state_changed")
    def on_state(state):
        logger.info(f"Agent state changed: {state}")

    @session.on("user_speech_started")
    def on_user_speech(ev):
        logger.info("User speech detected")

    await session.start(room=ctx.room)
    logger.info("Session started. Waiting 2s for SIP path stabilization...")
    await asyncio.sleep(2)
    
    logger.info("Triggering greeting...")
    handle = await session.generate_reply()
    logger.info("generate_reply() handle received. Waiting for playout...")
    
    try:
        await asyncio.wait_for(handle.wait_for_playout(), timeout=10)
        logger.info("Greeting playout COMPLETED")
    except Exception as e:
        logger.error(f"Greeting FAILED or timed out: {e}")

    await asyncio.sleep(20)
    ctx.delete_room()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name="diagnostic-agent"))
