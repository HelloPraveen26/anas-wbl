import json
import logging
import os
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


@dataclass
class SessionConfig:
    user_id: Optional[str] = None
    phone_number: Optional[str] = None
    outbound_trunk_id: Optional[str] = None

    instructions: Optional[str] = None
    first_message: str = "Hello! How can I help you today?"

    realtime_provider_name: Optional[str] = None
    llm_provider_name: Optional[str] = None
    stt_provider_name: Optional[str] = None
    tts_provider_name: Optional[str] = None

    llm_config: Dict[str, Any] = field(default_factory=dict)
    realtime_model_config: Dict[str, Any] = field(default_factory=dict)
    stt_config: Dict[str, Any] = field(default_factory=dict)
    tts_config: Dict[str, Any] = field(default_factory=dict)

    environment: str = field(
        default_factory=lambda: os.getenv("ENVIRONMENT", "production")
    )
    app_version: str = field(default_factory=lambda: os.getenv("APP_VERSION", "1.0.0"))


class SessionConfigParser:
    @staticmethod
    def parse_metadata(metadata_input: Any) -> Dict[str, Any]:
        if not metadata_input:
            return {}

        try:
            if isinstance(metadata_input, str):
                return json.loads(metadata_input)
            elif isinstance(metadata_input, dict):
                return metadata_input
            else:
                return {}
        except (json.JSONDecodeError, TypeError, AttributeError):
            logger.warning(
                "Failed to parse metadata, using defaults: %s", metadata_input
            )
            return {}

    @classmethod
    def from_job_context(cls, ctx) -> SessionConfig:
        metadata = {}
        if hasattr(ctx.job, "metadata") and ctx.job.metadata:
            metadata = cls.parse_metadata(ctx.job.metadata)
        if not metadata and hasattr(ctx.room, "metadata") and ctx.room.metadata:
            metadata = cls.parse_metadata(ctx.room.metadata)
        return SessionConfig(
            user_id=metadata.get("user_id"),
            phone_number=metadata.get("phone_number"),
            outbound_trunk_id=metadata.get("outbound_trunk_id"),
            instructions=metadata.get("instructions"),
            first_message=metadata.get(
                "first_message", "Hello! How can I help you today?"
            ),
            realtime_provider_name=metadata.get("realtime_provider_name"),
            llm_provider_name=metadata.get("llm_provider_name"),
            stt_provider_name=metadata.get("stt_provider_name"),
            tts_provider_name=metadata.get("tts_provider_name"),
            llm_config=metadata.get("llm_config", {}),
            realtime_model_config=metadata.get("realtime_model_config", {}),
            stt_config=metadata.get("stt_config", {}),
            tts_config=metadata.get("tts_config", {}),
        )
