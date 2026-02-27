import asyncio
import base64
import json
import logging
import os
import time
from datetime import datetime, timezone
import aiohttp
import httpx

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
from livekit.agents import llm as agent_llm
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


async def hangup_call():
    """Hang up the call by deleting the room for all participants."""
    ctx = get_job_context()
    if ctx is None:
        logger.warning("Cannot hang up: not running in a job context")
        return

    logger.info(f"Hanging up call for room: {ctx.room.name}")
    await ctx.api.room.delete_room(api.DeleteRoomRequest(room=ctx.room.name))


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def _wait_for_participant(room: rtc.Room, timeout: float = 1.0):
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
        logger.info("Langfuse not configured.")
        return None

    langfuse_auth = base64.b64encode(f"{public_key}:{secret_key}".encode()).decode()
    os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = f"{host.rstrip('/')}/api/public/otel"
    os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {langfuse_auth}"

    trace_provider = TracerProvider()
    trace_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    set_tracer_provider(trace_provider, metadata=metadata)
    return trace_provider


async def entrypoint(ctx: JobContext):
    entrypoint_start = time.time()
    ctx.log_context_fields = {"room": ctx.room.name}

    # Connect first
    connect_start = time.time()
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connection established in {time.time() - connect_start:.2f}s")

    # Parse metadatas
    metadata_start = time.time()
    metadata = {}
    raw_meta = ctx.job.metadata or ctx.room.metadata or "{}"
    try:
        metadata = json.loads(raw_meta) if isinstance(raw_meta, str) else raw_meta
    except:
        logger.warning("Failed to parse metadata")

    logger.info(f"Metadata parsed in {time.time() - metadata_start:.2f}s")

    # Get dynamic parameters
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
    knowledgebase_content = metadata.get("knowledgebase_content")

    # Setup telemetry background
    async def setup_telemetry_async():
        try:
            langfuse_metadata = {
                "langfuse.session.id": ctx.room.name,
                "langfuse.trace.name": f"Voice Agent Session - {ctx.room.name}",
            }
            if user_id:
                langfuse_metadata["langfuse.user.id"] = user_id

            trace_provider = setup_langfuse(metadata=langfuse_metadata)
            if trace_provider:

                async def flush_trace_provider():
                    trace_provider.force_flush()

                ctx.add_shutdown_callback(flush_trace_provider)
        except Exception:
            pass

    asyncio.create_task(setup_telemetry_async())

    # --- 3. MERGE INSTRUCTIONS (Personality + Metadata + Tools) ---
    is_json_instructions = False
    try:
        if custom_instructions:
            trimmed = custom_instructions.strip()
            # Try to find a JSON-like structure even if there's trailing text
            start_idx = trimmed.find("{")
            end_idx = trimmed.rfind("}")
            if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                potential_json = trimmed[start_idx : end_idx + 1]
                parsed = json.loads(potential_json)
                if isinstance(parsed, dict) and (
                    "nodes" in parsed or 
                    "welcome" in parsed or 
                    "call_flow" in parsed or
                    "language_rules" in parsed or
                    "identity" in parsed
                ):
                    is_json_instructions = True
                    # Keep the original instruction text but we know it's a flow
    except:
        pass

    if is_json_instructions:
        # Extract JSON and non-JSON parts
        trimmed = custom_instructions.strip()
        start_idx = trimmed.find("{")
        end_idx = trimmed.rfind("}")
        
        json_str = trimmed[start_idx : end_idx + 1]
        other_text = (trimmed[:start_idx] + "\n" + trimmed[end_idx + 1 :]).strip()

        # Inject default language rules if missing
        try:
            parsed_flow = json.loads(json_str)
            if "language_rules" not in parsed_flow:
                parsed_flow["language_rules"] = {
                    "mandatory_language_selection": True,
                    "supported_languages": ["Tamil", "English", "Malayalam", "Hindi"] 
                }
                # Update json_content to include the injected rules
                json_content = json.dumps(parsed_flow, indent=2)
            else:
                json_content = json_str
        except:
             json_content = json_str
        
        # Structured flow instructions
        final_instructions = f"""You are a voice AI assistant that follows a STRICT conversation flow defined in JSON format. You MUST ONLY follow the flow. You are NOT a general-purpose assistant.
        
## Your Core Persona and Style:
Tone: Warm, calm, respectful, professional.
{other_text if other_text else DEFAULT_PERSONALITY}

## STRICT Conversation & Language Rules:

1. **NODE 1: START & LANGUAGE SELECTION**
   - **Starting Node**: The conversation ALWAYS starts at the "welcome" node.
   - **Mandatory Selection**: "language_rules.mandatory_language_selection" is TRUE.
   - **Task**: Verify language BEFORE doing anything else.
   - **Script**: "Hello welcome! Which language do you prefer? Tamil, English, Malayalam, or Hindi?"
   - **Rule**: Do not answer other questions regardless of user input until a language is chosen.
   - **TRANSITION**: As soon as language is confirmed, IMMEDIATELY jump to the "welcome" node and speak its message in the chosen language.

2. **NODE 2+: LOCKED LANGUAGE EXECUTION**
   - **Requirement**: Once a language is chosen (e.g., Tamil), you MUST speak **ONLY** in that language.
   - **Strict Pathing**: If the user says **NO** (or negative), DO NOT explain the "Yes" option. Just take the "No" path.
   - **Tamil Rule**: If Tamil is selected, use **Chennai Tanglish**. DO NOT speak full English sentences.
     - *Bad*: "Okay, let's proceed."
     - *Good*: "Sari, namma polam. Nandri! Welcome! Ungalukku eppadi help panna mudiyum?" (Translated welcome message).
   - **PRONUNCIATION FIXES**:
     - **"Conduct"**: When saying "we conduct class", say "**Naanga oru class Nadathurom**" (native) or "**Con-duct panrom**" (clear English). Do NOT say "Kan-duct".
     - **General**: Ensure English words in Tanglish are pronounced with clear Indian English accent.
   - **Consistency**: Maintain this language strictly for the entire call unless the user explicitly asks to switch.

3. **CONVERSATION ETIQUETTE**:
   - **One Question Only**: Ask only one question at a time.
   - **No Filler Words**: No "um", "uh".
   - **No AI Disclosure**: Do not say you are an AI.
   - **Male**: "Sir", **Female**: "Ma'am", **Uncertain**: Neutral.

4. **OFF-TOPIC / RANDOM REPLIES (CRITICAL)**:
   - If the user asks a random question, gives an unrelated reply, or goes off-topic, you MUST:
     1. **Briefly acknowledge** what they said in a warm, polite way (1 short sentence max). Do NOT give a detailed answer.
     2. **Immediately redirect** back to the SAME current flow node by repeating the current question or message.
   - **Examples**:
     - User: "What's the weather today?" → You: "That's a good question! But right now, let me help you with [current flow question]."
     - User: "Tell me a joke" → You: "Haha, sure some other time! So, [repeat current flow question]."
     - User: "abcdef" / random gibberish → You: "I didn't quite get that. [Repeat current flow question]."
   - **NEVER** give a full or detailed answer to off-topic questions. Keep acknowledgment to ONE short sentence, then redirect.
   - **NEVER** skip or move to the next node because of a random reply. Stay on the SAME node until the user gives a valid response.
   - Even if the user asks the same off-topic question repeatedly, keep redirecting back to the flow every time.

5. **INTENT & BUTTON LOGIC**:
   - **STRICT MATCHING**: Listen carefully to the user.
   - **Negatives**: If user says "No", "Not interested", "Don't want", or "Cancel", you MUST trigger the button corresponding to that negative intent.
     - *CRITICAL*: Do NOT force a "Yes" path if the user says "No".
     - *Example*: User says "I don't have a laptop" -> Trigger the "no laptop" button. Do NOT say "That's okay, use a phone" unless the flow specifically has that response.
   - **Positives**: If user says "Yes", "Interested", or "Okay", trigger the positive button.

6. **INTERRUPTION & SPEED**:
   - **Barge-In**: If the user speaks while you are talking, STOP immediately. Listen to them.
   - **Latency**: Respond within 0.1 seconds. Keep answers short and direct.
   - **Resume**: Calculate the new response based on their interruption, do not just repeat the old message.

7. **FLOW TRANSITIONS & TRANSLATION**:
   - **CRITICAL RULE**: The flow content (JSON) is in English. **YOU MUST TRANSLATE IT** to the selected language before speaking.
   - **NO EXTRA TEXT**: Speak ONLY the translated content of the JSON message. Do NOT add generic phrases like "How can I help you?" unless they are in the JSON.
   - **Example**: 
     - JSON Message: "We conduct AI class on Monday."
     - User Language: Tamil
     - **YOU SAY**: "Naanga coming Monday oru AI class nadathurom." (Direct translation).
     - **DO NOT SAY**: "Naanga class nadathurom. *Ungalukku eppadi help panna mudiyum?*" (Don't add the help question if it's not in the text).
   - **Output**: Speak the *translated* version of the "message" field.
   - **Input**: Listen for keywords/intents (in the user's language) to trigger the English button actions.
   - **Ghost Node**: If the flow has a "welcome" message, do NOT speak it until language is selected. Speak the translated version AFTER selection.

## Flow Configuration (JSON):
{json_content}
"""
    else:
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

    # Initialize model
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

    puck_system_msg = final_instructions

    def _create_groq_llm():
        # Llama 3 on Groq is extremely fast
        return groq.LLM(model="llama3-8b-8192", temperature=0.6)

    def _create_openai_llm():
        # GPT-4o-mini is optimized for latency
        return openai.LLM(model="gpt-4o-mini", temperature=0.6)

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
            target_language_code=language_code, 
            model="bulbul:v2", 
            speaker=speaker,
            # Ensure chunk_size is small for faster streaming
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

    def _create_deepgram_tts():
        return deepgram.TTS()

    # Initialization Logic
    async def _init_llm():
        provider = realtime_provider_name or llm_provider_name
        if provider == "Gemini Realtime":
            return _create_gemini_realtime_llm()
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
        return _create_deepgram_tts()

    # Parallel Initialization
    models_start = time.time()
    
    # Initialize models concurrently
    tasks = []
    
    if realtime_provider_name:
        tasks.append(_init_llm())
        tasks.append(asyncio.sleep(0)) # Placeholder for stt
        tasks.append(asyncio.sleep(0)) # Placeholder for tts
    else:
        tasks.append(_init_llm())
        tasks.append(_init_stt())
        tasks.append(_init_tts())
        
    llm, stt, tts = await asyncio.gather(*tasks)
    
    # If realtime, stt/tts are None (handled by the provider)
    if realtime_provider_name:
        stt = None
        tts = None
        
    logger.info(f"🚀 All models initialized in {time.time() - models_start:.2f}s")

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
            # TUNED FOR LOW LATENCY & INTERRUPTIBILITY
            turn_detection_delay=0.3,  # Detect end of speech quickly (300ms) for fast response
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

    # SHUTDOWN CALLBACK: WEBHOOKS & PERSISTENCE
    async def shutdown_cleanup():
        logger.info("📞 Call ending - syncing webhooks...")
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

    # Final Greet (with safety timeout)
    await _wait_for_participant(ctx.room)

    # Safety: If it's a JSON flow, try to extract welcome message from instructions first
    greet_text = custom_first_message
    if is_json_instructions:
        try:
            trimmed = custom_instructions.strip()
            start_idx = trimmed.find("{")
            end_idx = trimmed.rfind("}")
            if start_idx != -1 and end_idx != -1:
                flow_json = json.loads(trimmed[start_idx : end_idx + 1])
                # 1. Check for Language Rules first
                lang_rules = flow_json.get("language_rules", {})
                
                # Default to TRUE if language_rules is missing completely (to support simple flows with mandatory lang selection)
                # If language_rules exists but key is missing, default to False (standard get behavior)
                if "language_rules" not in flow_json:
                    is_mandatory_lang = True
                else:
                    is_mandatory_lang = lang_rules.get("mandatory_language_selection", False)
                
                # 2. Check for IRa call_flow structure
                call_flow = flow_json.get("call_flow", {})
                lang_selection_script = call_flow.get("language_selection", {}).get("script")
                
                if is_mandatory_lang and not lang_selection_script:
                    # Auto-generate language question if mandatory but missing script
                    supported = lang_rules.get("supported_languages", ["Tamil", "English", "Malayalam", "Hindi"])
                    # Use a clean, direct first message to establish the language selection node
                    welcome_msg = "Hello welcome! Which language do you prefer? Tamil, English, Malayalam, or Hindi?"
                else:
                    # Standard welcome extraction
                    welcome_msg = (
                        lang_selection_script or 
                        flow_json.get("welcome", {}).get("message") or
                        (flow_json.get("nodes", {}).get("welcome", {}).get("message") if "nodes" in flow_json else None) or
                        (flow_json.get("nodes", {}).get("node_welcome", {}).get("message") if "nodes" in flow_json else None)
                    )

                if welcome_msg and (greet_text == "Hello!" or not greet_text or "help you today?" in greet_text):
                    greet_text = welcome_msg
                    logger.info(f"Using start message (Auto-Lang: {is_mandatory_lang}): {greet_text}")
        except Exception as e:
            logger.warning(f"Failed to extract structured flow start message: {e}")
            pass

    # Secondary check: If custom_first_message itself looks like JSON
    try:
        if isinstance(greet_text, str) and "{" in greet_text and "}" in greet_text:
            trimmed = greet_text.strip()
            start_idx = trimmed.find("{")
            end_idx = trimmed.rfind("}")
            mj = json.loads(trimmed[start_idx : end_idx + 1])
            if isinstance(mj, dict):
                greet_text = (
                    mj.get("message")
                    or mj.get("text")
                    or mj.get("first_message")
                    or mj.get("welcome", {}).get("message")
                    or greet_text
                )
    except:
        pass

    # Always speak first - starting node is "welcome"
    try:
        if greet_text:
            logger.info(f"🗣️ Speaking first message (welcome node): {greet_text}")
            await asyncio.wait_for(
                session.generate_reply(instructions=f"Start conversation immediately by saying exactly: '{greet_text}'"),
                timeout=2.0,
            )
    except Exception as e:
        logger.warning(f"Initial greeting timed out or failed: {e}")

    logger.info(f"✨ Total Boot Time: {time.time() - entrypoint_start:.2f}s")

    # ============== Call Safeguards ==============
    # Prevent stuck calls (e.g. customer puts phone aside without hanging up)
    MAX_CALL_DURATION = int(os.getenv("MAX_CALL_DURATION", 300))  # 5 minutes
    INACTIVITY_TIMEOUT = int(os.getenv("INACTIVITY_TIMEOUT", 120))  # 2 minutes

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
            # Force room deletion to ensure cleanup
            # Note: ctx.delete_room() returns a Future/Task, not a coroutine
            ctx.delete_room()

    async def _watchdog_task():
        """Watchdog: Terminate call if duration exceeded AND user inactive"""
        call_start = time.time()
        while not call_ended:
            await asyncio.sleep(10)

            call_duration = time.time() - call_start
            inactive_duration = time.time() - last_user_activity

            if (
                call_duration > MAX_CALL_DURATION
                and inactive_duration > INACTIVITY_TIMEOUT
            ):
                logger.warning(
                    f"Call timeout triggered: duration={call_duration:.0f}s (max={MAX_CALL_DURATION}s), "
                    f"inactive={inactive_duration:.0f}s (max={INACTIVITY_TIMEOUT}s). Terminating call."
                )
                try:
                    await ctx.delete_room()
                except Exception as e:
                    logger.error(f"Failed to delete room on timeout: {e}")
                break

    watchdog = asyncio.create_task(_watchdog_task())

    async def _cancel_watchdog():
        watchdog.cancel()

    ctx.add_shutdown_callback(_cancel_watchdog)


if __name__ == "__main__":
    # Initialize the event loop to avoid RuntimeError in newer Python versions
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name="hexite-outbound-caller",
        )
    )
