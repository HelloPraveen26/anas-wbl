"""Inbound voice agent - handles incoming phone calls"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from livekit import rtc
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
from livekit.plugins import silero
from shared import (
    DEFAULT_INBOUND_PERSONALITY,
    INACTIVITY_TIMEOUT,
    MAX_CALL_DURATION,
    DynamicToolHandler,
    ModelProvider,
    ToolFactory,
    load_all_tools,
)

logger = logging.getLogger("livekit.agents.inbound")
load_dotenv(".env", override=True)


# Helper function
async def _wait_for_participant(room: rtc.Room, timeout: float = 10.0):
    """Wait for a remote participant to connect"""
    if room.remote_participants:
        logger.info("Participant already connected")
        return

    logger.info("Waiting for participant to connect...")
    future = asyncio.Future()

    def _on_participant_connected(p: rtc.RemoteParticipant):
        if not future.done():
            future.set_result(None)

    room.on("participant_connected", _on_participant_connected)

    if room.remote_participants:
        if not future.done():
            future.set_result(None)
        return

    try:
        await asyncio.wait_for(future, timeout=timeout)
        logger.info("Participant connection confirmed")
    except asyncio.TimeoutError:
        logger.warning(f"Timeout waiting for participant to connect after {timeout}s")


# Assistant class with end_call function
class Assistant(Agent):
    def __init__(self, instructions: str | None = None, tools: list = None) -> None:
        super().__init__(
            instructions=instructions or DEFAULT_INBOUND_PERSONALITY, tools=tools or []
        )

    @function_tool
    async def end_call(self, ctx: RunContext):
        """Called when the user wants to end the call"""
        await ctx.wait_for_playout()
        logger.info("User requested to end the call")
        goodbye_said = False

        try:
            goodbye_handle = await ctx.session.say(
                "Thank you for calling. Have a great day! Goodbye!",
                allow_interruptions=False,
            )
            await goodbye_handle.wait_for_playout()
            goodbye_said = True
            logger.info("Goodbye message delivered via session.say()")
        except Exception:
            try:
                goodbye_handle = await asyncio.wait_for(
                    ctx.session.generate_reply(
                        instructions="Say a brief, friendly goodbye message like 'Thank you for calling. Have a great day! Goodbye!'",
                    ),
                    timeout=3.0,
                )
                try:
                    await asyncio.wait_for(
                        goodbye_handle.wait_for_playout(), timeout=3.0
                    )
                    goodbye_said = True
                    logger.info("Goodbye message delivered via generate_reply()")
                except asyncio.TimeoutError:
                    logger.warning("Goodbye message playout timeout")
            except Exception as e:
                logger.warning(f"Could not say goodbye: {e}")

        ctx.session.shutdown(drain=True)
        job_ctx = get_job_context()
        if job_ctx:
            logger.info(f"Deleting room: {job_ctx.room.name}")
            await job_ctx.delete_room()


async def _fetch_assistant_config(assistant_id: str) -> dict | None:
    """Fetch full assistant config from dispatcher backend. Returns None on 404 or error."""
    backend_url = os.getenv("FASTAPI_BASE_URL", "http://localhost:8000")
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{backend_url}/assistants/{assistant_id}/config")
            if resp.status_code == 200:
                return resp.json().get("config", {})
    except Exception as e:
        logger.warning(f"Could not fetch assistant config for {assistant_id}: {e}")
    return None


async def _fetch_caller_override(assistant_id: str, caller_phone: str) -> dict | None:
    """Fetch per-caller override from dispatcher backend. Returns None on 404 or error."""
    phone_key = caller_phone.replace("+", "").replace("-", "")
    backend_url = os.getenv("FASTAPI_BASE_URL", "http://localhost:8000")
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{backend_url}/caller-override/{assistant_id}/{phone_key}")
            if resp.status_code == 200:
                return resp.json().get("override", {})
    except Exception as e:
        logger.warning(f"Could not fetch caller override for {caller_phone}: {e}")
    return None


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    entrypoint_start = time.time()
    ctx.log_context_fields = {"room": ctx.room.name}

    # Connect first
    connect_start = time.time()
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connection established in {time.time() - connect_start:.2f}s")

    # Wait for SIP participant BEFORE model init so we can extract caller phone
    # and fetch per-caller config before choosing LLM/STT/TTS settings.
    # (SIP participant is already in the room by the time the agent joins — usually instant.)
    await _wait_for_participant(ctx.room)

    # Extract caller phone early — needed for per-caller config lookup before model init
    caller_phone: str | None = None
    for p in ctx.room.remote_participants.values():
        if p.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
            caller_phone = p.attributes.get("sip.phoneNumber", "") or None
            if caller_phone:
                logger.info(f"Inbound caller phone: {caller_phone}")
            break

    # --- Metadata loading (3-layer merge: job → assistant config → caller override) ---
    metadata_start = time.time()
    metadata: dict = {}

    # Layer 1: job metadata from RoomAgentDispatch (highest precedence for dispatch-level config)
    raw_meta = ctx.job.metadata or "{}"
    try:
        job_meta = json.loads(raw_meta) if isinstance(raw_meta, str) else raw_meta
        if job_meta:
            metadata = {**job_meta}
            logger.info("📦 Loaded metadata from job dispatch")
    except Exception as e:
        logger.warning(f"Failed to parse job metadata: {e}")

    # Layer 1b: room metadata fallback (for older dispatch rules without job metadata)
    if not metadata:
        room_meta_str = ctx.room.metadata or "{}"
        try:
            room_meta = json.loads(room_meta_str) if isinstance(room_meta_str, str) else room_meta_str
            if "agent_metadata" in room_meta:
                metadata = room_meta["agent_metadata"]
                logger.info("📦 Loaded metadata from room configuration")
            elif room_meta:
                metadata = room_meta
                logger.info("📦 Loaded metadata from room (fallback)")
        except Exception as e:
            logger.warning(f"Failed to parse room metadata: {e}")

    # Layer 2: assistant config — fetched live from backend by assistant_id.
    # Overrides dispatch-level values, so frontend can update config without recreating dispatch rules.
    assistant_id_from_dispatch = metadata.get("assistant_id")
    if assistant_id_from_dispatch:
        assistant_cfg = await _fetch_assistant_config(assistant_id_from_dispatch)
        if assistant_cfg:
            metadata = {**metadata, **assistant_cfg}
            logger.info(f"📦 Loaded assistant config for {assistant_id_from_dispatch} ({list(assistant_cfg.keys())})")
        else:
            logger.debug(f"No assistant config found for {assistant_id_from_dispatch}, using dispatch defaults")

    # Layer 3: per-caller override — optional, highest priority.
    # Allows each client to personalise greetings and pre-fill tool fields per caller.
    if assistant_id_from_dispatch and caller_phone:
        caller_override = await _fetch_caller_override(assistant_id_from_dispatch, caller_phone)
        if caller_override:
            metadata = {**metadata, **caller_override}
            logger.info(f"📦 Loaded caller override for {caller_phone}")

    logger.info(f"Metadata parsed in {time.time() - metadata_start:.2f}s")

    # Get dynamic parameters
    # Use caller_phone extracted from SIP participant above; fall back to metadata field
    phone_number = caller_phone or metadata.get("phone_number")
    custom_instructions = metadata.get("instructions") or metadata.get("system_prompt")
    # custom_first_message: caller override key is "custom_first_message", assistant config key is "first_message"
    custom_first_message = (
        metadata.get("custom_first_message")
        or metadata.get("first_message")
        or "Hello! Thank you for calling. How can I help you?"
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
    knowledgebase_content = metadata.get("knowledgebase_content")

    # Merge instructions (Personality + Metadata + Tools)
    final_instructions = DEFAULT_INBOUND_PERSONALITY
    if custom_instructions:
        final_instructions += (
            f"\n\nAdditional contexts and instructions:\n{custom_instructions}"
        )
    if knowledgebase_content:
        logger.info(
            f"📚 Knowledge base found ({len(knowledgebase_content)} chars), injecting into instructions"
        )
        final_instructions += f"\n\n## Knowledge Base\nUse the following information to answer user questions:\n\n{knowledgebase_content}"

    # Load tools
    tool_handlers = {}
    if assistant_id:
        logger.info("🔧 Loading tools for assistant...")
        tools_data = await load_all_tools(assistant_id)
        for cfg in tools_data:
            name = cfg.get("toolName")
            if name:
                handler = DynamicToolHandler(cfg, assistant_id, metadata)
                await handler.prepopulate_from_metadata()
                tool_handlers[name] = handler
                # Merge tool prompts into final instructions
                tool_prompt = handler.get_tool_instructions()
                if tool_prompt:
                    final_instructions += tool_prompt

    # Initialize models via shared factory
    models_start = time.time()

    if realtime_provider_name is None:
        llm, stt, tts = await asyncio.gather(
            ModelProvider.create_llm(
                llm_provider_name,
                realtime_provider_name,
                llm_config,
                realtime_model_config,
                final_instructions,
            ),
            ModelProvider.create_stt(stt_provider_name, stt_config),
            ModelProvider.create_tts(tts_provider_name, tts_config),
        )
    else:
        llm = await ModelProvider.create_llm(
            llm_provider_name,
            realtime_provider_name,
            llm_config,
            realtime_model_config,
            final_instructions,
        )
        stt, tts = None, None

    logger.info(f"All models initialized in {time.time() - models_start:.2f}s")

    # Tool Factory
    all_tools = ToolFactory.create_tools(tool_handlers)

    # Setup Session
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

    # Metrics
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # Transcript Sync
    @session.on("agent_state_changed")
    def _on_state_change(state):
        chat = getattr(session, "chat_ctx", None)
        messages = getattr(chat, "messages", [])
        if messages:
            last = messages[-1]
            role = "Assistant" if last.role == "assistant" else "User"
            content = str(last.content)
            for handler in tool_handlers.values():
                if (
                    not handler.transcript
                    or handler.transcript[-1] != f"{role}: {content}"
                ):
                    asyncio.create_task(handler.add_to_transcript(role, content))

    # SHUTDOWN CALLBACK: WEBHOOKS & PERSISTENCE
    async def shutdown_cleanup():
        logger.info("📞 Call ending - syncing webhooks...")
        # 1. Tool-specific webhooks
        tool_tasks = [h.send_to_webhook(is_final=True) for h in tool_handlers.values()]

        # 2. Transcript and Call Completion
        try:
            if hasattr(session, "history"):
                fastapi_url = os.getenv("FASTAPI_BASE_URL", "http://localhost:8003")
                async with httpx.AsyncClient(timeout=5.0) as client:
                    # Transcript
                    await client.post(
                        f"{fastapi_url}/transcript/{ctx.room.name}",
                        json={
                            "room_name": ctx.room.name,
                            "history": session.history.to_dict(),
                            "captured_at": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                    # Call Completion Webhook
                    await client.post(
                        f"{fastapi_url}/webhook",
                        json={
                            "room_name": ctx.room.name,
                            "event_type": "call_completed",
                        },
                    )
        except Exception as e:
            logger.error(f"Persistence error: {e}")

        if tool_tasks:
            await asyncio.gather(*tool_tasks, return_exceptions=True)

    ctx.add_shutdown_callback(shutdown_cleanup)

    # Start Session
    session_start_time = time.time()
    await session.start(
        agent=Assistant(instructions=final_instructions, tools=all_tools),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            close_on_disconnect=True,
            delete_room_on_close=True,
        ),
    )
    logger.info(f"Session started in {time.time() - session_start_time:.2f}s")

    # Pre-populate caller phone into tool handlers (participant + phone already extracted above)
    if phone_number:
        for handler in tool_handlers.values():
            params = handler.tool_config.get("parameters", {})
            for param_name in params:
                if param_name.lower() in ("phone_number", "phonenumber", "phone"):
                    if param_name not in handler.collected_data:
                        handler.collected_data[param_name] = phone_number

    # Greet (participant already connected — wait was done before model init)
    try:
        await session.generate_reply(
            instructions=f"Start by saying: '{custom_first_message}'"
        )
    except Exception as e:
        logger.warning(f"Initial greeting failed: {e}")

    logger.info(f"✨ Total Boot Time: {time.time() - entrypoint_start:.2f}s")

    # Call Safeguards
    last_user_activity = time.time()
    call_ended = False

    @session.on("user_input_transcribed")
    def _on_user_activity(ev):
        nonlocal last_user_activity
        last_user_activity = time.time()

    # Handle SIP participant disconnection
    @ctx.room.on("participant_disconnected")
    def _on_participant_disconnected(participant: rtc.RemoteParticipant):
        nonlocal call_ended
        if participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP:
            logger.info(f"SIP participant disconnected: {participant.identity}")
            call_ended = True
            ctx.delete_room()

    async def _watchdog_task():
        """Hard watchdog: unconditionally terminates the call after MAX_CALL_DURATION"""
        call_start = time.time()
        while not call_ended:
            await asyncio.sleep(10)

            elapsed = time.time() - call_start
            inactive = time.time() - last_user_activity

            if elapsed >= MAX_CALL_DURATION:
                logger.warning(
                    f"Hard call limit reached: {elapsed:.0f}s >= {MAX_CALL_DURATION}s. Cutting call."
                )
                try:
                    await ctx.delete_room()
                except Exception as e:
                    logger.error(f"Failed to delete room on hard timeout: {e}")
                break

            if inactive >= INACTIVITY_TIMEOUT:
                logger.warning(
                    f"Inactivity timeout: {inactive:.0f}s >= {INACTIVITY_TIMEOUT}s. Cutting call."
                )
                try:
                    await ctx.delete_room()
                except Exception as e:
                    logger.error(f"Failed to delete room on inactivity: {e}")
                break

    watchdog = asyncio.create_task(_watchdog_task())

    # Cancel watchdog on normal shutdown
    async def _cancel_watchdog():
        watchdog.cancel()

    ctx.add_shutdown_callback(_cancel_watchdog)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="inbound-agent",
        )
    )
