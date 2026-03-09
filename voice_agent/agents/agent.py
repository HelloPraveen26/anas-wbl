import asyncio
import json
import logging
import os
import time
from datetime import datetime, timezone

import aiohttp
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
from livekit.agents import llm as agent_llm
from livekit.plugins import (
    aws,
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
logger = logging.getLogger("agent")

load_dotenv("/Users/sumanpaudel/zenvoice/voice_agent/agents/.env", override=True)

# -----------------------------------------------------------------------------
# DynamicToolHandler: Advanced Multi-Tool Orchestration
# -----------------------------------------------------------------------------
class DynamicToolHandler:
    """Handles dynamic tool configuration and data collection with metadata pre-population"""

    def __init__(self, tool_config: dict, assistant_id: str, metadata: dict = None):
        """
        Initialize tool handler for a SINGLE tool
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

            backend_url = "http://127.0.0.1:8000/api/v1/assistants/agent-webhook"
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


# -----------------------------------------------------------------------------
# Global Helper Functions
# -----------------------------------------------------------------------------
async def load_all_tools(assistant_id: str) -> list:
    """Load ALL tool configurations for an assistant from backend"""
    try:
        url = f"http://127.0.0.1:8000/api/v1/assistants/tool-config/{assistant_id}"
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

    if room.remote_participants:
        if not future.done():
            future.set_result(None)
        return

    try:
        await asyncio.wait_for(future, timeout=timeout)
        logger.info("Participant connection confirmed")
    except asyncio.TimeoutError:
        logger.warning(f"Timeout waiting for participant to connect after {timeout}s")


DEFAULT_PERSONALITY = """You are a helpful voice AI assistant.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            If the user clearly wants to end the conversation, call the end_call function.
            You are curious, friendly, and have a sense of humor."""


class Assistant(Agent):
    def __init__(self, instructions: str | None = None, tools: list = None) -> None:
        super().__init__(
            instructions=instructions or DEFAULT_PERSONALITY, tools=tools or []
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
    knowledgebase_content = metadata.get("knowledgebase_content")

    # --- 3. MERGE INSTRUCTIONS (Personality + Metadata + Tools) ---
    final_instructions = DEFAULT_PERSONALITY
    if custom_instructions:
        final_instructions += (
            f"\n\nAdditional contexts and instructions:\n{custom_instructions}"
        )
    if knowledgebase_content:
        logger.info(
            f"📚 Knowledge base found ({len(knowledgebase_content)} chars), injecting into instructions"
        )
        final_instructions += f"\n\n## Knowledge Base\nUse the following information to answer user questions:\n\n{knowledgebase_content}"

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

    # Initialize models
    models_start = time.time()
    azure_speech_key = os.getenv("AZURE_SPEECH_KEY")
    azure_speech_region = os.getenv("AZURE_SPEECH_REGION")

    # Model Factories
    def _create_gemini_realtime_llm():
        voice = (realtime_model_config or {}).get("voice") or "Puck"
        logger.info("Realtime Voice: %s", voice)
        model = (realtime_model_config or {}).get(
            "model"
        ) or "gemini-2.5-flash-native-audio-preview-12-2025"

        # ⚠️ Safety: If metadata passes the failing model name, override it to the working preview
        if model == "gemini-2.0-flash-live-001":
            logger.warning(
                f"⚠️ Model '{model}' failed previously. Overriding to preview version."
            )
            model = "gemini-2.5-flash-native-audio-preview-12-2025"

        logger.info("Realtime Model: %s", model)
        return google.realtime.RealtimeModel(
            model=model,
            voice=voice,
            temperature=0.4,
            instructions=final_instructions,
        )

    def _create_nova_sonic_realtime_llm():
        voice = (realtime_model_config or {}).get("voice") or "tiffany"
        turn_detection = (realtime_model_config or {}).get("turn_detection") or "MEDIUM"
        region = (realtime_model_config or {}).get("region") or os.getenv("AWS_DEFAULT_REGION", "ap-northeast-1")
        logger.info("Nova Sonic Voice: %s, Turn Detection: %s, Region: %s", voice, turn_detection, region)
        return aws.realtime.RealtimeModel.with_nova_sonic_2(
            voice=voice,
            turn_detection=turn_detection,
            region=region,
        )

    def _create_groq_llm():
        return groq.LLM(model="llama3-8b-8192")

    def _create_openai_llm():
        return openai.LLM(model="gpt-4.1-mini")

    def _create_sarvam_stt():
        language_code = (stt_config or {}).get("language") or "en_IN"
        logger.info("Language Code: %s", language_code)
        return sarvam.STT(language=language_code, model="saarika:v2.5")

    def _create_groq_stt():
        language = (stt_config or {}).get("language") or "en"
        logger.info("Language: %s", language)
        return groq.STT(model="whisper-large-v3-turbo", language=language)

    def _create_azure_stt():
        return azure.STT(speech_key=azure_speech_key, speech_region=azure_speech_region)

    def _create_deepgram_stt():
        return deepgram.STT(model="nova-3", language="multi")

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
        return google.beta.GeminiTTS(voice_name=voice)

    def _create_groq_tts():
        return groq.TTS(
            model="playai-tts", voice=(tts_config or {}).get("voice", "Arista-PlayAI")
        )

    def _create_azure_tts():
        return azure.TTS(speech_key=azure_speech_key, speech_region=azure_speech_region)

    def _create_lmnt_tts():
        return lmnt.TTS(voice=(tts_config or {}).get("voice", "leah"))

    def _create_elevenlabs_tts():
        voice_id = (tts_config or {}).get("voice_id") or "EXAVITQu4vr4xnSDxMaL"
        model = (tts_config or {}).get("model") or "eleven_flash_v2_5"
        logger.info("ElevenLabs Voice ID: %s, Model: %s", voice_id, model)
        return elevenlabs.TTS(voice_id=voice_id, model=model)

    def _create_deepgram_tts():
        return deepgram.TTS()

    # Initialization Logic
    async def _init_llm():
        provider = realtime_provider_name or llm_provider_name
        if provider == "Gemini Realtime":
            return _create_gemini_realtime_llm()
        if provider == "Nova Sonic":
            return _create_nova_sonic_realtime_llm()
        if provider == "Groq":
            return _create_groq_llm()
        return _create_openai_llm()

    async def _init_stt():
        if stt_provider_name == "Sarvam":
            return _create_sarvam_stt()
        if stt_provider_name == "Groq":
            return _create_groq_stt()
        if stt_provider_name == "Azure":
            return _create_azure_stt()
        return _create_deepgram_stt()

    async def _init_tts():
        if tts_provider_name == "Sarvam":
            return _create_sarvam_tts()
        if tts_provider_name == "Gemini":
            return _create_gemini_tts()
        if tts_provider_name == "Groq":
            return _create_groq_tts()
        if tts_provider_name == "Azure":
            return _create_azure_tts()
        if tts_provider_name == "lmnt":
            return _create_lmnt_tts()
        if tts_provider_name == "ElevenLabs":
            return _create_elevenlabs_tts()
        return _create_deepgram_tts()

    if realtime_provider_name is None:
        llm, stt, tts = await asyncio.gather(_init_llm(), _init_stt(), _init_tts())
    else:
        llm, stt, tts = await _init_llm(), None, None
    logger.info(f"All models initialized in {time.time() - models_start:.2f}s")

    # Tool Factory
    def make_tool_function(handler, fn_name):
        @agent_llm.function_tool(name=fn_name, description=f"Store data for {fn_name}")
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

    all_tools = [
        make_tool_function(h, f"collect_{n}") for n, h in tool_handlers.items()
    ]

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

    # Metrics (from branch code)
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
    call_timing = {"start_time": None, "end_time": None}

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
            logger.warning("Call start time was never recorded (participant may not have connected)")
        # 1. Tool-specific webhooks
        tool_tasks = [h.send_to_webhook(is_final=True) for h in tool_handlers.values()]

        # 2. PR-Specific Persistence (Transcript and Call Completion)
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
                    await client.post(
                        "http://localhost:8000/api/v1/webhooks/call-summary",
                        json={
                            "room_name": ctx.room.name,
                            "history": session.history.to_dict(),
                            "start_time": call_timing["start_time"].isoformat() if call_timing["start_time"] else None,
                            "end_time": call_timing["end_time"].isoformat() if call_timing["end_time"] else None,
                            "call_duration_seconds": call_duration_seconds,
                        },
                    )
                    # Call Completion Webhook
                    await client.post(
                        f"{fastapi_url}/webhook",
                        json={
                            "room_name": ctx.room.name,
                            "event_type": "call_completed",
                            "start_time": call_timing["start_time"].isoformat() if call_timing["start_time"] else None,
                            "end_time": call_timing["end_time"].isoformat() if call_timing["end_time"] else None,
                            "call_duration": call_duration_seconds,
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

    # Final Greet (with safety timeout)
    await _wait_for_participant(ctx.room)
    call_timing["start_time"] = datetime.now(timezone.utc)
    logger.info(f"📞 Call start time recorded: {call_timing['start_time'].isoformat()}")
    try:
        await asyncio.wait_for(
            session.generate_reply(
                instructions=f"Start by saying: '{custom_first_message}'"
            ),
            timeout=5.0,
        )
    except Exception as e:
        logger.warning(f"Initial greeting timed out or failed: {e}")

    logger.info(f"✨ Total Boot Time: {time.time() - entrypoint_start:.2f}s")

    # ============== Call Safeguards ==============
    # Hard limit: call is cut no matter what after MAX_CALL_DURATION
    MAX_CALL_DURATION = int(os.getenv("MAX_CALL_DURATION", 300))  # 5 minutes
    INACTIVITY_TIMEOUT = int(os.getenv("INACTIVITY_TIMEOUT", 60))  # 1 minute

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
            agent_name="outbound-caller",
        )
    )
