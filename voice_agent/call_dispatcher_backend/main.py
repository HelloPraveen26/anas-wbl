import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
from pydantic import BaseModel, Field, validator

# Load environment variables
_ = load_dotenv()

# E.164 phone number regex pattern
E164_PATTERN = re.compile(r"^\+[1-9]\d{1,14}$")

app = FastAPI(
    title="Telephony Call Dispatcher",
    description="API for dispatching phone calls through LiveKit",
    version="1.0.0",
)


class CallRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="user_id")
    phone_number: str = Field(
        ...,
        description="Phone number in E.164 format (+ followed by country code and number, up to 15 digits total). "
        "See: https://www.twilio.com/docs/glossary/what-e164",
        examples=["+1234567890", "+441234567890", "+919876543210", "+8613912345678"],
        pattern=r"^\+[1-9]\d{1,14}$",
    )
    outbound_trunk_id: str = Field(
        ...,
        description="Outbound trunk ID to use for the call",
        examples=["trunk1", "trunk2", "trunk3"],
    )
    from_phone_number: Optional[str] = Field(
        None,
        description="From phone number in E.164 format",
        pattern=r"^\+[1-9]\d{1,14}$",
    )

    instructions: Optional[str] = Field(
        None, description="Custom instructions for the AI agent"
    )

    first_message: Optional[str] = Field(
        None, description="Custom first message the agent should say"
    )
    realtime_provider_name: Optional[str] = Field(
        None, description="realtime_provider_name"
    )
    llm_provider_name: Optional[str] = Field(None, description="llm_provider_name")
    stt_provider_name: Optional[str] = Field(None, description="stt_provider_name")
    tts_provider_name: Optional[str] = Field(None, description="tts_provider_name")
    llm_config: Optional[Dict[str, Any]] = Field(None, description="llm_config")
    realtime_model_config: Optional[Dict[str, Any]] = Field(
        None, description="realtime_model_config"
    )
    stt_config: Optional[Dict[str, Any]] = Field(None, description="stt_config")
    tts_config: Optional[Dict[str, Any]] = Field(None, description="tts_config")
    sip_headers: Optional[Dict[str, str]] = Field(
        None,
        description="Optional SIP headers to include in the INVITE request. Required for some providers like Telecimi.",
        examples=[{"X-Provider-Username": "username"}],
    )
    assistant_id: Optional[str] = Field(
        None, description="Assistant ID for webhook routing and tool configuration"
    )

    webhook_url: Optional[str] = Field(
        None, description="Backend webhook URL to send collected data"
    )

    # 🆕 ADD FLEXIBLE METADATA FIELD
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata for tool pre-population (e.g., name, email, company, etc.)",
    )

    @validator("phone_number")
    def validate_e164_format(cls, v):
        """Validate that phone number follows E.164 format"""
        if not E164_PATTERN.match(v):
            raise ValueError(
                "Phone number must be in E.164 format: + followed by country code and number (1-15 digits total). "
                "Examples: +1234567890, +441234567890. "
                "Learn more: https://www.twilio.com/docs/glossary/what-e164"
            )
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "phone_number": "+1234567890",
                "outbound_trunk_id": "trunk1",
                "instructions": "You are a friendly customer service agent",
                "first_message": "Hello! How can I help you today?",
                "assistant_id": "016208c6-99c1-4dba-935c-3e6256f60785",
                "webhook_url": "https://webhook.site/your-unique-id",
                "metadata": {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "company": "Acme Corp",
                },
            },
            "description": "Request body for initiating a phone call with custom agent behavior and metadata pre-population",
        }


class SIPDetails(BaseModel):
    participant_id: str
    participant_identity: str
    room_name: str
    sip_call_id: str
    phone_number: str
    sip_status: str = "initiated"
    created_at: datetime = datetime.now()


class DispatchDetails(BaseModel):
    id: str
    agent_name: str
    phone_number: str
    created: datetime = datetime.now()
    dispatch_status: str = "active"


class CallResponse(BaseModel):
    success: bool = Field(description="Whether the call was successfully initiated")
    room_name: str = Field(description="LiveKit room name for this call")
    phone_number: str = Field(description="Phone number that was called")
    sip_details: Dict[str, Any] = Field(description="SIP participant details")
    dispatch: Dict[str, Any] = Field(description="Agent dispatch details")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "room_name": "sip-a1b2c3d4",
                "phone_number": "+1234567890",
                "sip_details": {
                    "participant_id": "PA_12345",
                    "participant_identity": "phone_user",
                    "room_name": "sip-a1b2c3d4",
                    "sip_call_id": "call_67890",
                    "phone_number": "+1234567890",
                    "sip_status": "initiated",
                },
                "dispatch": {
                    "id": "dispatch_12345",
                    "agent_name": "hexite-outbound-caller",
                    "phone_number": "+1234567890",
                    "dispatch_status": "active",
                },
            }
        }


class HangupResponse(BaseModel):
    message: str = Field(description="Confirmation message for hangup action")
    room_name: str = Field(description="Name of the room that was deleted")
    timestamp: str = Field(description="Timestamp when the hangup occurred")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Call ended successfully",
                "room_name": "sip-a1b2c3d4",
                "timestamp": "2025-09-25T10:30:00Z",
            }
        }


class ErrorResponse(BaseModel):
    detail: str = Field(description="Error message describing what went wrong")

    class Config:
        json_schema_extra = {"example": {"detail": "Phone number is required"}}


def sip_parser(sip_details: str, phone_number: str) -> dict:
    parsed = {}
    for line in sip_details.strip().split("\n"):
        if ": " in line:
            key, value = line.split(": ", 1)
            parsed[key.strip()] = value.strip().strip('"')

    return SIPDetails(**parsed, phone_number=phone_number).model_dump()


def dispatch_parser(dispatch: str, phone_number: str) -> dict:
    parsed = {}
    for line in dispatch.strip().split("\n"):
        if ": " in line:
            key, value = line.split(": ", 1)
            parsed[key.strip()] = value.strip().strip('"')

    return DispatchDetails(**parsed, phone_number=phone_number).model_dump()


# Global variable to track current active room
current_active_room = None

# Set up logging
logger = logging.getLogger("make-call")
logger.setLevel(logging.INFO)

# Add console handler to make logs visible
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Configuration
agent_name = "hexite-outbound-caller"
outbound_trunk_id = os.getenv("SIP_OUTBOUND_TRUNK_ID", "")
lk_url = os.getenv("LIVEKIT_URL", "")
lk_api_secret = os.getenv("LIVEKIT_API_SECRET", "")
lk_api_key = os.getenv("LIVEKIT_API_KEY", "")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Validate configuration on startup"""
    missing_vars = []
    if not lk_url:
        missing_vars.append("LIVEKIT_URL")
    if not lk_api_secret:
        missing_vars.append("LIVEKIT_API_SECRET")
    if not lk_api_key:
        missing_vars.append("LIVEKIT_API_KEY")
    if not outbound_trunk_id:
        missing_vars.append("SIP_OUTBOUND_TRUNK_ID")

    if missing_vars:
        logger.error(
            f"Missing required environment variables: {', '.join(missing_vars)}"
        )
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing_vars)}"
        )

    logger.info("Call dispatcher backend started successfully")


@app.get(
    "/health",
    summary="Health Check",
    description="Check if the service is running and healthy. Returns service status and timestamp.",
)
async def health_check():
    """Health check endpoint - returns service status and current timestamp"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "telephony-call-dispatcher",
        "version": "1.0.0",
    }


async def make_call(
    metadata, room_name, phone_number, outbound_trunk_id, sip_headers=None
):
    """Create a dispatch and add a SIP participant to call the phone number"""
    if not phone_number:
        raise HTTPException(status_code=400, detail="Phone number is required")

    lkapi = api.LiveKitAPI(
        api_secret=lk_api_secret,
        api_key=lk_api_key,
        url=lk_url,
    )

    try:
        logger.info(f"Creating dispatch for agent {agent_name} in room {room_name}")
        logger.info(f"Metadata: {metadata}")
        dispatch = await lkapi.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=agent_name, room=room_name, metadata=metadata
            )
        )
        logger.info(f"Created dispatch: {dispatch}")
        logger.info(f"Dialing {phone_number} to room {room_name}")

    except Exception as e:
        await lkapi.aclose()
        logger.error(f"Error dispatching the agent to room: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Error occurred while dispatching the agent to room: {e}",
        )

    try:
        logger.info(sip_headers)
        sip_participant = await lkapi.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                room_name=room_name,
                sip_trunk_id=outbound_trunk_id,
                sip_call_to=phone_number,
                participant_identity="phone_user",
                participant_metadata=metadata,
                headers=sip_headers,
            )
        )
        logger.info(f"Created SIP participant: {sip_participant}")
        await lkapi.aclose()
        return sip_participant, dispatch

    except Exception as e:
        await lkapi.aclose()
        logger.error(f"Error creating SIP participant: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Error occurred while creating SIP participant: {e}",
        )


@app.post(
    "/make_call",
    response_model=CallResponse,
    responses={
        200: {"description": "Call successfully initiated", "model": CallResponse},
        400: {
            "description": "Bad Request - Invalid phone number format or missing required fields",
            "model": ErrorResponse,
        },
        500: {
            "description": "Internal Server Error - Failed to initiate call",
            "model": ErrorResponse,
        },
    },
    summary="Initiate Outbound Phone Call",
)
async def make_call_endpoint(request: CallRequest):
    """Endpoint to initiate a call to the provided phone number"""
    # Extract parameters from request
    outbound_trunk_id = request.outbound_trunk_id
    phone_number = request.phone_number
    instructions = request.instructions
    first_message = request.first_message
    realtime_provider_name = request.realtime_provider_name
    llm_provider_name = request.llm_provider_name
    stt_provider_name = request.stt_provider_name
    tts_provider_name = request.tts_provider_name
    realtime_model_config = request.realtime_model_config
    llm_config = request.llm_config
    stt_config = request.stt_config
    tts_config = request.tts_config
    assistant_id = request.assistant_id
    webhook_url = request.webhook_url
    user_id = request.user_id
    custom_metadata = request.metadata or {}  # 🆕 Extract custom metadata
    sip_headers = request.sip_headers

    if not phone_number:
        raise HTTPException(status_code=400, detail="Phone number is required")

    if not E164_PATTERN.match(phone_number):
        raise HTTPException(
            status_code=400,
            detail="Phone number must be in E.164 format: + followed by country code and number (1-15 digits total). "
            "Examples: +1234567890, +441234567890. "
            "Learn more: https://www.twilio.com/docs/glossary/what-e164",
        )

    try:
        # 🆕 Create base metadata for the call
        base_metadata = {
            "outbound_trunk_id": outbound_trunk_id,
            "phone_number": phone_number,
            "call_type": "outbound",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "instructions": instructions,
            "first_message": first_message,
            "realtime_provider_name": realtime_provider_name,
            "llm_provider_name": llm_provider_name,
            "stt_provider_name": stt_provider_name,
            "tts_provider_name": tts_provider_name,
            "realtime_model_config": realtime_model_config,
            "llm_config": llm_config,
            "stt_config": stt_config,
            "tts_config": tts_config,
            "assistant_id": assistant_id,
            "webhook_url": webhook_url,
            "user_id": user_id,
        }

        # 🆕 MERGE CUSTOM METADATA - This allows pre-population of tool parameters
        metadata = {**base_metadata, **custom_metadata}

        # Log the metadata for debugging
        logger.info("=============================================")
        logger.info(f"📞 Initiating call with metadata:")
        logger.info(f"📱 Phone: {phone_number}")
        logger.info(f"🆔 Assistant ID: {assistant_id}")
        logger.info(f"🔗 Webhook URL: {webhook_url}")

        # Log custom metadata if present
        if custom_metadata:
            logger.info("🎯 Custom metadata for tool pre-population:")
            for key, value in custom_metadata.items():
                logger.info(f"   • {key}: {value}")

        logger.info("=============================================")

        # Generate unique room name
        room_name = f"sip-{str(uuid4().hex[:8])}"

        # Track the current active room globally
        global current_active_room
        current_active_room = room_name

        # Make the call with merged metadata
        sip_details, dispatch = await make_call(
            json.dumps(metadata),
            room_name,
            phone_number,
            outbound_trunk_id,
            sip_headers,
        )

        logger.info(
            f"✅ Successfully initiated call to {phone_number} in room {room_name}"
        )

        return {
            "success": True,
            "room_name": room_name,
            "phone_number": phone_number,
            "sip_details": sip_parser(str(sip_details), phone_number),
            "dispatch": dispatch_parser(str(dispatch), phone_number),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to initiate call to {phone_number}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to initiate the call: {str(e)}"
        )


@app.post("/hangup", response_model=HangupResponse)
async def hangup_call():
    """Endpoint to hangup/terminate the current active call"""
    global current_active_room

    try:
        if not current_active_room:
            raise HTTPException(
                status_code=404, detail="No active call found to hangup"
            )

        room_name = current_active_room

        lkapi = api.LiveKitAPI(
            api_key=lk_api_key,
            api_secret=lk_api_secret,
            url=lk_url,
        )

        try:
            await lkapi.room.delete_room(api.DeleteRoomRequest(room=room_name))
            logger.info(f"Room deleted successfully: {room_name}")
        except Exception as room_error:
            logger.warning(f"Failed to delete room {room_name}: {room_error}")
            raise HTTPException(
                status_code=400, detail=f"Failed to delete room: {str(room_error)}"
            )
        finally:
            await lkapi.aclose()

        logger.info(f"Call hung up - Room deleted: {room_name}")

        # Clear the active room since it's been deleted
        current_active_room = None

        return {
            "message": "Call ended successfully",
            "room_name": room_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error hanging up call: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to hangup call: {str(e)}")


@app.get("/active_call")
async def get_active_call():
    """Get information about the current active call"""
    global current_active_room

    if not current_active_room:
        return {"active": False, "message": "No active call", "room_name": None}

    return {
        "active": True,
        "message": "Call is active",
        "room_name": current_active_room,
    }


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Telephony Call Dispatcher",
        "version": "1.0.0",
        "description": "API for dispatching outbound phone calls through LiveKit SIP integration with metadata pre-population support",
    }
