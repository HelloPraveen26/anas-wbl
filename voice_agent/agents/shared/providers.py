"""Model provider factory for creating LLM, STT, and TTS instances"""
import logging
import os
from typing import Any, Dict, Optional

from google.genai import types as gemini_types
from livekit.agents import APIConnectOptions
from livekit.plugins import (
    azure,
    deepgram,
    google,
    groq,
    lmnt,
    openai,
    sarvam,
)

logger = logging.getLogger("providers")


class ModelProvider:
    """Factory for creating model instances based on provider names and configs"""

    @staticmethod
    async def create_llm(
        provider_name: Optional[str],
        realtime_provider_name: Optional[str] = None,
        llm_config: Optional[Dict[str, Any]] = None,
        realtime_model_config: Optional[Dict[str, Any]] = None,
        instructions: Optional[str] = None,
    ):
        """Create LLM instance based on provider name"""
        provider = realtime_provider_name or provider_name

        if provider == "Gemini Realtime":
            return ModelProvider._create_gemini_realtime_llm(
                realtime_model_config, instructions
            )
        if provider == "Groq":
            return ModelProvider._create_groq_llm(llm_config)
        return ModelProvider._create_openai_llm(llm_config)

    @staticmethod
    async def create_stt(
        provider_name: Optional[str], stt_config: Optional[Dict[str, Any]] = None
    ):
        """Create STT instance based on provider name"""
        if provider_name == "Sarvam":
            return ModelProvider._create_sarvam_stt(stt_config)
        if provider_name == "Groq":
            return ModelProvider._create_groq_stt(stt_config)
        if provider_name == "Azure":
            return ModelProvider._create_azure_stt()
        return ModelProvider._create_deepgram_stt()

    @staticmethod
    async def create_tts(
        provider_name: Optional[str], tts_config: Optional[Dict[str, Any]] = None
    ):
        """Create TTS instance based on provider name"""
        if provider_name == "Sarvam":
            return ModelProvider._create_sarvam_tts(tts_config)
        if provider_name == "Gemini":
            return ModelProvider._create_gemini_tts(tts_config)
        if provider_name == "Groq":
            return ModelProvider._create_groq_tts(tts_config)
        if provider_name == "Azure":
            return ModelProvider._create_azure_tts()
        if provider_name == "lmnt":
            return ModelProvider._create_lmnt_tts(tts_config)
        return ModelProvider._create_deepgram_tts()

    # LLM Factories
    @staticmethod
    def _create_gemini_realtime_llm(config: Optional[Dict], instructions: Optional[str]):
        voice = (config or {}).get("voice") or "Puck"
        logger.info(f"Realtime Voice: {voice}")
        model = (config or {}).get("model") or "gemini-3.1-flash-live-preview"
        allowed_models = [
            "gemini-2.5-flash-native-audio-preview-09-2025",
            "gemini-2.5-flash-native-audio-preview-12-2025",
            "gemini-3.1-flash-live-preview",
        ]
        
        # Fallback logic: if requested model is not in whitelist, default to 3.1
        if model not in allowed_models:
            logger.warning(f"Requested model '{model}' is not in whitelist. Falling back to 'gemini-3.1-flash-live-preview'.")
            model = "gemini-3.1-flash-live-preview"

        language = (config or {}).get("language", "en-US")
        logger.info(f"Realtime Model: {model}, Language: {language}")

        # Resilient connection options for Gemini Realtime (transient 1011 errors)
        gemini_conn_options = APIConnectOptions(
            max_retry=5, retry_interval=2.0, timeout=15.0
        )

        is_3_1 = "3.1" in model

        # Base kwargs shared by all Gemini realtime models
        kwargs: Dict[str, Any] = {
            "model": model,
            "voice": voice,
            "language": language,
            "temperature": 0.4,
            "instructions": instructions,
            "input_audio_transcription": gemini_types.AudioTranscriptionConfig(),
            # Gemini VAD tuning for customer calls:
            # - HIGH start sensitivity: quickly detect customer speech
            # - HIGH end sensitivity + 500ms silence: respond quickly in
            #   fast-paced business calls without awkward pauses
            "realtime_input_config": gemini_types.RealtimeInputConfig(
                automatic_activity_detection=gemini_types.AutomaticActivityDetection(
                    start_of_speech_sensitivity=gemini_types.StartSensitivity.START_SENSITIVITY_HIGH,
                    end_of_speech_sensitivity=gemini_types.EndSensitivity.END_SENSITIVITY_HIGH,
                    silence_duration_ms=500,
                ),
            ),
            "conn_options": gemini_conn_options,
        }

        # 2.5 Flash supports these extended features; 3.1 Flash has not been
        # confirmed to support them yet — start conservatively and add back
        # once validated.
        if not is_3_1:
            kwargs["proactivity"] = True
            kwargs["enable_affective_dialog"] = True
            # Cap conversation context to prevent latency growth over time.
            # System instructions are excluded from this limit.
            # ~4k tokens ≈ last 2-3 Q&A exchanges for Gemini audio.
            kwargs["context_window_compression"] = gemini_types.ContextWindowCompressionConfig(
                sliding_window=gemini_types.SlidingWindow(target_tokens=4096),
            )
            kwargs["session_resumption"] = gemini_types.SessionResumptionConfig(transparent=True)

        return google.realtime.RealtimeModel(**kwargs)

    @staticmethod
    def _create_groq_llm(config: Optional[Dict]):
        model = (config or {}).get("model", "llama3-8b-8192")
        return groq.LLM(model=model)

    @staticmethod
    def _create_openai_llm(config: Optional[Dict]):
        model = (config or {}).get("model", "gpt-4.1-mini")
        return openai.LLM(model=model)

    # STT Factories
    @staticmethod
    def _create_sarvam_stt(config: Optional[Dict]):
        language_code = (config or {}).get("language", "en_IN")
        logger.info(f"Language Code: {language_code}")
        return sarvam.STT(language=language_code, model="saarika:v2.5")

    @staticmethod
    def _create_groq_stt(config: Optional[Dict]):
        language = (config or {}).get("language", "en")
        logger.info(f"Language: {language}")
        return groq.STT(model="whisper-large-v3-turbo", language=language)

    @staticmethod
    def _create_azure_stt():
        azure_speech_key = os.getenv("AZURE_SPEECH_KEY")
        azure_speech_region = os.getenv("AZURE_SPEECH_REGION")
        return azure.STT(speech_key=azure_speech_key, speech_region=azure_speech_region)

    @staticmethod
    def _create_deepgram_stt():
        return deepgram.STT(model="nova-3", language="multi")

    # TTS Factories
    @staticmethod
    def _create_sarvam_tts(config: Optional[Dict]):
        speaker = (config or {}).get("speaker", "anushka")
        logger.info(f"Speaker: {speaker}")
        language_code = (config or {}).get("target_language_code", "en_IN")
        logger.info(f"Language Code: {language_code}")
        return sarvam.TTS(
            target_language_code=language_code, model="bulbul:v2", speaker=speaker
        )

    @staticmethod
    def _create_gemini_tts(config: Optional[Dict]):
        voice = (config or {}).get("voice_name", "Zephyr")
        logger.info(f"Voice Name: {voice}")
        return google.beta.GeminiTTS(voice_name=voice)

    @staticmethod
    def _create_groq_tts(config: Optional[Dict]):
        voice = (config or {}).get("voice", "Arista-PlayAI")
        return groq.TTS(model="playai-tts", voice=voice)

    @staticmethod
    def _create_azure_tts():
        azure_speech_key = os.getenv("AZURE_SPEECH_KEY")
        azure_speech_region = os.getenv("AZURE_SPEECH_REGION")
        return azure.TTS(speech_key=azure_speech_key, speech_region=azure_speech_region)

    @staticmethod
    def _create_lmnt_tts(config: Optional[Dict]):
        voice = (config or {}).get("voice", "leah")
        return lmnt.TTS(voice=voice)

    @staticmethod
    def _create_deepgram_tts():
        return deepgram.TTS()
