"""Generate fresh LiveKit tokens for testing.

Usage:
    python generate_token.py                                    # Nova Sonic realtime
    python generate_token.py --provider elevenlabs              # ElevenLabs TTS (pipelined)
    python generate_token.py --provider gemini                  # Gemini Realtime
    python generate_token.py --provider default                 # Default (Deepgram + OpenAI)
    python generate_token.py --room my-room                     # custom room name
"""

import argparse
import datetime
import json
import os
import uuid

from dotenv import load_dotenv
from livekit.api import AccessToken, RoomAgentDispatch, RoomConfiguration, VideoGrants

load_dotenv("agents/.env", override=True)

AGENT_NAME = "hexite-outbound-caller"

PROVIDER_PRESETS: dict[str, dict] = {
    "nova-sonic": {
        "realtime_provider_name": "Nova Sonic",
        "realtime_model_config": {
            "voice": "tiffany",
            "turn_detection": "MEDIUM",
            "region": "ap-northeast-1",
        },
        "instructions": "You are a helpful voice assistant. Be concise and friendly.",
        "first_message": "Hello! How can I help you?",
    },
    "elevenlabs": {
        "tts_provider_name": "ElevenLabs",
        "tts_config": {
            "voice_id": "EXAVITQu4vr4xnSDxMaL",
            "model": "eleven_flash_v2_5",
        },
        "instructions": "You are a helpful voice assistant. Be concise and friendly.",
        "first_message": "Hello! How can I help you?",
    },
    "gemini-2.5-09": {
        "realtime_provider_name": "Gemini Realtime",
        "realtime_model_config": {
            "voice": "Puck",
            "model": "gemini-2.5-flash-native-audio-preview-09-2025",
        },
        "instructions": "You are a helpful voice assistant. Be concise and friendly.",
        "first_message": "Hello! How can I help you?",
    },
    "gemini-2.5-12": {
        "realtime_provider_name": "Gemini Realtime",
        "realtime_model_config": {
            "voice": "Puck",
            "model": "gemini-2.5-flash-native-audio-preview-12-2025",
        },
        "instructions": "You are a helpful voice assistant. Be concise and friendly.",
        "first_message": "Hello! How can I help you?",
    },
    "gemini-3.1": {
        "realtime_provider_name": "Gemini Realtime",
        "realtime_model_config": {
            "voice": "Puck",
            "model": "gemini-3.1-flash-live-preview",
        },
        "instructions": "You are a helpful voice assistant. Be concise and friendly.",
        "first_message": "Hello! How can I help you?",
    },
    "default": {
        "instructions": "You are a helpful voice assistant. Be concise and friendly.",
        "first_message": "Hello! How can I help you?",
    },
}


def generate_token(
    provider: str = "nova-sonic",
    room_name: str | None = None,
    identity: str | None = None,
    ttl_hours: int = 24,
) -> dict[str, str]:
    api_key = os.environ["LIVEKIT_API_KEY"]
    api_secret = os.environ["LIVEKIT_API_SECRET"]
    livekit_url = os.environ["LIVEKIT_URL"]

    metadata = PROVIDER_PRESETS.get(provider, PROVIDER_PRESETS["default"])
    room = room_name or f"test-{uuid.uuid4().hex[:8]}"
    participant = identity or f"user-{uuid.uuid4().hex[:6]}"

    token = (
        AccessToken(api_key, api_secret)
        .with_identity(participant)
        .with_name("Test User")
        .with_grants(VideoGrants(room_join=True, room=room))
        .with_ttl(datetime.timedelta(hours=ttl_hours))
        .with_room_config(
            RoomConfiguration(
                agents=[
                    RoomAgentDispatch(
                        agent_name=AGENT_NAME,
                        metadata=json.dumps(metadata),
                    )
                ],
            ),
        )
        .to_jwt()
    )

    return {
        "token": token,
        "room": room,
        "identity": participant,
        "provider": provider,
        "url": f"https://meet.livekit.io/custom?liveKitUrl={livekit_url}&token={token}",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate LiveKit access tokens")
    parser.add_argument(
        "--provider",
        default="nova-sonic",
        choices=list(PROVIDER_PRESETS.keys()),
        help="Provider preset (default: nova-sonic)",
    )
    parser.add_argument(
        "--room", default=None, help="Room name (auto-generated if omitted)"
    )
    parser.add_argument(
        "--identity",
        default=None,
        help="Participant identity (auto-generated if omitted)",
    )
    parser.add_argument(
        "--ttl", type=int, default=24, help="Token TTL in hours (default: 24)"
    )
    args = parser.parse_args()

    result = generate_token(
        provider=args.provider,
        room_name=args.room,
        identity=args.identity,
        ttl_hours=args.ttl,
    )

    print(f"\nProvider: {result['provider']}")
    print(f"Agent:    {AGENT_NAME}")
    print(f"Room:     {result['room']}")
    print(f"Identity: {result['identity']}")
    print(f"\n{result['url']}\n")

