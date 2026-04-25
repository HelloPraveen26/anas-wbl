"""Outbound voice agent - handles outgoing phone calls"""

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
    APIConnectOptions,
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
from livekit.agents.voice.agent_session import SessionConnectOptions
from livekit.plugins import silero
from shared import (
    DEFAULT_OUTBOUND_PERSONALITY,
    INACTIVITY_TIMEOUT,
    MAX_CALL_DURATION,
    DynamicToolHandler,
    ModelProvider,
    ToolFactory,
    load_all_tools,
)
from shared.gemini_tool_call_fix import apply_gemini_3_1_patch

# Apply Gemini 3.1 class-level patch (safe no-op if already applied or not using Google)
apply_gemini_3_1_patch()

logger = logging.getLogger("outbound-agent")
load_dotenv(".env", override=True)


# Helper function
async def _wait_for_participant(room: rtc.Room, timeout: float = 10.0) -> bool:
    """Wait for a remote participant to connect. Returns True if connected, False if timeout."""
    if room.remote_participants:
        logger.info("Participant already connected")
        return True

    logger.info("Waiting for participant to connect...")
    future = asyncio.Future()

    def _on_participant_connected(p: rtc.RemoteParticipant):
        if not future.done():
            future.set_result(None)

    room.on("participant_connected", _on_participant_connected)

    if room.remote_participants:
        if not future.done():
            future.set_result(None)
        return True

    try:
        await asyncio.wait_for(future, timeout=timeout)
        logger.info("Participant connection confirmed")
        return True
    except asyncio.TimeoutError:
        logger.warning(f"Timeout waiting for participant to connect after {timeout}s")
        return False


# Assistant class with end_call function
class Assistant(Agent):
    def __init__(self, instructions: str | None = None, tools: list = None) -> None:
        super().__init__(
            instructions=instructions or DEFAULT_OUTBOUND_PERSONALITY, tools=tools or []
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


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    entrypoint_start = time.time()
    ctx.log_context_fields = {"room": ctx.room.name}

    # Connect first
    connect_start = time.time()
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connection established in {time.time() - connect_start:.2f}s")

    # Parse metadata
    metadata_start = time.time()
    metadata = {}
    raw_meta = ctx.job.metadata or ctx.room.metadata or "{}"
    try:
        metadata = json.loads(raw_meta) if isinstance(raw_meta, str) else raw_meta
    except:
        logger.warning("Failed to parse metadata")

    logger.info(f"Metadata parsed in {time.time() - metadata_start:.2f}s")

    # Get dynamic parameters
    phone_number = metadata.get("phone_number")  # Already set for outbound
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
    knowledgebase_content = metadata.get("knowledgebase_content")
    call_log_id = metadata.get("call_log_id") or metadata.get("config", {}).get("call_log_id")

    # Merge instructions (Personality + Metadata + Tools)
    final_instructions = DEFAULT_OUTBOUND_PERSONALITY
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
        gemini_conn_options = APIConnectOptions(
            max_retry=5, retry_interval=2.0, timeout=15.0
        )
        session = AgentSession(
            llm=llm,
            vad=ctx.proc.userdata["vad"],
            conn_options=SessionConnectOptions(
                llm_conn_options=gemini_conn_options,
                max_unrecoverable_errors=5,
            ),
        )

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

    # Call timing tracking (mutable dict so shutdown_cleanup closure can read updates)
    call_timing = {"start_time": None, "end_time": None, "connected": False}

    # SHUTDOWN CALLBACK: WEBHOOKS & PERSISTENCE
    async def shutdown_cleanup():
        logger.info("📞 Call ending - syncing webhooks...")

        # Compute call timing
        call_timing["end_time"] = datetime.now(timezone.utc)
        call_duration_seconds = None
        if call_timing["start_time"]:
            call_duration_seconds = round(
                (call_timing["end_time"] - call_timing["start_time"]).total_seconds(), 2
            )
            logger.info(
                f"📊 Call duration: {call_duration_seconds}s "
                f"(start={call_timing['start_time'].isoformat()}, "
                f"end={call_timing['end_time'].isoformat()})"
            )
        else:
            logger.warning(
                "Call start time was never recorded (participant may not have connected)"
            )
        # 1. Tool-specific webhooks
        tool_tasks = [h.send_to_webhook(is_final=True) for h in tool_handlers.values()]

        # 2. Transcript and Call Completion
        try:
            # Use session.history.to_dict() if available, fallback to chat_ctx
            if hasattr(session, "history") and hasattr(session.history, "to_dict"):
                history_items = session.history.to_dict().get("items", [])
                logger.info(f"📊 Captured {len(history_items)} history items from session.history")
            elif hasattr(session, "chat_ctx") and hasattr(session.chat_ctx, "messages"):
                chat_ctx = session.chat_ctx
                history_items = []
                for m in chat_ctx.messages:
                    role_str = str(m.role).lower()
                    if "user" in role_str: role_str = "user"
                    elif "assistant" in role_str: role_str = "assistant"
                    history_items.append({
                        "id": getattr(m, "id", f"msg_{int(time.time()*1000)}"),
                        "type": "message",
                        "role": role_str,
                        "content": [str(m.content)] if not isinstance(m.content, list) else [str(c) for c in m.content],
                        "interrupted": False
                    })
                logger.info(f"📊 Captured {len(history_items)} history items from session.chat_ctx")
            else:
                logger.warning("⚠️ Could not find session.history or session.chat_ctx")
                history_items = []
            # Write to temp file for debugging since terminal is not working
            try:
                import json
                with open("./debug_history_outbound.json", "w") as f:
                    json.dump({
                        "session_type": str(type(session)),
                        "has_chat_ctx": hasattr(session, "chat_ctx"),
                        "history_count": len(history_items),
                        "history": history_items,
                        "metadata": metadata
                    }, f, indent=2)
                logger.info("DEBUG: Wrote history to d:/newfixed/debug_history_outbound.json")
            except Exception as e:
                logger.error(f"DEBUG: Failed to write debug file: {e}")

            # Always send summary to update duration/status, even if history is empty
            fastapi_url = os.getenv("FASTAPI_BASE_URL", "http://localhost:8003")
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Transcript (only if messages exist)
                if history_items:
                    await client.post(
                        f"{fastapi_url}/transcript/{ctx.room.name}",
                        json={
                            "room_name": ctx.room.name,
                            "history": {"items": history_items},
                            "captured_at": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                
                # Call Summary Hook (Always)
                await client.post(
                    "http://localhost:8000/api/v1/webhooks/call-summary",
                    json={
                        "room_name": ctx.room.name,
                        "history": {"items": history_items},
                        "start_time": (call_timing["start_time"] or datetime.now(timezone.utc)).isoformat(),
                        "end_time": (call_timing["end_time"] or datetime.now(timezone.utc)).isoformat(),
                        "call_duration_seconds": call_duration_seconds or 0,
                        "call_log_id": call_log_id,
                        "type": "outbound",
                        "participant_connected": call_timing.get("connected", False),
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

    # Start session and wait for participant concurrently (no data dependency)
    session_start_time = time.time()
    participant_task = asyncio.create_task(_wait_for_participant(ctx.room))

    # Set start_time when participant connects to ensure accurate timing
    async def _on_participant_ready():
        connected = await participant_task
        if connected and not call_timing["start_time"]:
            call_timing["connected"] = True
            call_timing["start_time"] = datetime.now(timezone.utc)
            logger.info(f"📞 Participant connected, start time recorded: {call_timing['start_time'].isoformat()}")

    # Start timing task in background
    asyncio.create_task(_on_participant_ready())

    # Start session
    logger.info("Starting agent session...")
    await session.start(
        agent=Assistant(instructions=final_instructions, tools=all_tools),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            close_on_disconnect=True,
            delete_room_on_close=True,
        ),
    )
    logger.info(f"Session started/finished. Boot time: {time.time() - entrypoint_start:.2f}s")

    # The greeting logic should also wait for participant
    # But generate_reply is non-blocking, so we can do it after session.start? 
    # Actually, for AgentSession, you generate_reply AFTER starting.
    # We should wait for participant before greeting.
    connected = await participant_task
    if connected:
        session.generate_reply(
            instructions=f"Start by saying: '{custom_first_message}'"
        )
    else:
        logger.warning("No participant connected, skipping greeting and shutting down.")
        await ctx.delete_room()

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
            agent_name="hexite-outbound-caller",
            num_idle_processes=1,
            port=8082,
        )
    )
