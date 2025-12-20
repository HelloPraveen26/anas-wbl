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
# E.164 format: + followed by up to 15 digits
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
    llm_provider_name: Optional[str] = Field(None, description="llm_provider_name")
    stt_provider_name: Optional[str] = Field(None, description="stt_provider_name")
    tts_provider_name: Optional[str] = Field(None, description="tts_provider_name")
    llm_config: Optional[Dict[str, Any]] = Field(None, description="llm_config")
    stt_config: Optional[Dict[str, Any]] = Field(None, description="stt_config")
    tts_config: Optional[Dict[str, Any]] = Field(None, description="tts_config")

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
                "instructions": "You are a friendly customer service agent",
                "first_message": "Hello! How can I help you today?",
            },
            "description": "Request body for initiating a phone call with custom agent behavior",
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
    allow_origins=["*"],  # <-- allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # <-- allow GET, POST, OPTIONS, DELETE, etc.
    allow_headers=["*"],  # <-- allow Content-Type, Authorization, etc.
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


async def make_call(metadata, room_name, phone_number, outbound_trunk_id):
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
        logger.info(metadata)
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
        sip_participant = await lkapi.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                room_name=room_name,
                sip_trunk_id=outbound_trunk_id,
                sip_call_to=phone_number,
                dtmf="#282699405",
                participant_identity="phone_user",
                participant_metadata=metadata,
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
            "content": {
                "application/json": {
                    "examples": {
                        "missing_phone": {
                            "summary": "Missing phone number",
                            "value": {"detail": "Phone number is required"},
                        },
                        "invalid_format": {
                            "summary": "Invalid E.164 format",
                            "value": {
                                "detail": "Phone number must be in E.164 format: + followed by country code and number (1-15 digits total). Examples: +1234567890, +441234567890. Learn more: https://www.twilio.com/docs/glossary/what-e164"
                            },
                        },
                    }
                }
            },
        },
        500: {
            "description": "Internal Server Error - Failed to initiate call",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Failed to initiate the call: Connection timeout"
                    }
                }
            },
        },
    },
    summary="Initiate Outbound Phone Call",
    description="""
    Initiates an outbound phone call through LiveKit SIP integration.

    **How to use:**
    1. Send a POST request to `/make_call`
    2. Include a JSON body with the phone number in E.164 format
    3. The system will create a LiveKit room and connect the call
    4. Use the `/hangup` endpoint with the returned room name to end the call

    **Required Environment Variables:**
    - `LIVEKIT_URL`: Your LiveKit server URL
    - `LIVEKIT_API_KEY`: Your LiveKit API key
    - `LIVEKIT_API_SECRET`: Your LiveKit API secret
    - `SIP_OUTBOUND_TRUNK_ID`: Your SIP trunk identifier

    **Phone Number Format (E.164):**
    - Must start with '+' followed by country code and number
    - Total length: 1-15 digits after the '+'
    - No spaces, dashes, or other formatting characters
    - Examples: +1234567890 (US), +441234567890 (UK), +8613912345678 (China)
    - Learn more: https://www.twilio.com/docs/glossary/what-e164

    **Call Management:**
    - Save the returned `room_name` to hangup the call later
    - Use POST `/hangup` with the room name to terminate the call
    """,
)
async def make_call_endpoint(request: CallRequest):
    """Endpoint to initiate a call to the provided phone number"""
    # Extract parameters from request (already validated by pydantic)
    outbound_trunk_id = request.outbound_trunk_id
    phone_number = request.phone_number
    instructions = request.instructions
    first_message = request.first_message
    llm_provider_name = request.llm_provider_name
    stt_provider_name = request.stt_provider_name
    tts_provider_name = request.tts_provider_name
    llm_config = request.llm_config
    stt_config = request.stt_config
    tts_config = request.tts_config
    user_id = request.user_id

    if not phone_number:
        raise HTTPException(status_code=400, detail="Phone number is required")

    # Additional validation (though pydantic should catch this)
    if not E164_PATTERN.match(phone_number):
        raise HTTPException(
            status_code=400,
            detail="Phone number must be in E.164 format: + followed by country code and number (1-15 digits total). "
            "Examples: +1234567890, +441234567890. "
            "Learn more: https://www.twilio.com/docs/glossary/what-e164",
        )

    try:
        # Create metadata for the call including dynamic parameters
        metadata = {
            "outbound_trunk_id": outbound_trunk_id,
            "phone_number": phone_number,
            "call_type": "outbound",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "instructions": instructions,
            "first_message": first_message,
            "llm_provider_name": llm_provider_name,
            "stt_provider_name": stt_provider_name,
            "tts_provider_name": tts_provider_name,
            "llm_config": llm_config,
            "stt_config": stt_config,
            "tts_config": tts_config,
            "user_id": user_id,
        }

        # Generate unique room name
        room_name = f"sip-{str(uuid4().hex[:8])}"

        # Track the current active room globally
        global current_active_room
        current_active_room = room_name

        # Make the call
        sip_details, dispatch = await make_call(
            json.dumps(metadata), room_name, phone_number, outbound_trunk_id
        )

        logger.info(
            f"Successfully initiated call to {phone_number} in room {room_name}"
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


@app.post(
    "/hangup",
    response_model=HangupResponse,
    responses={
        200: {"description": "Call successfully terminated", "model": HangupResponse},
        404: {
            "description": "No Active Call - No current call to hangup",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {"detail": "No active call found to hangup"}
                }
            },
        },
        400: {
            "description": "Bad Request - Failed to delete room",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to delete room: Room not found"}
                }
            },
        },
        500: {
            "description": "Internal Server Error - Failed to delete room",
            "model": ErrorResponse,
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to delete room: Connection timeout"}
                }
            },
        },
    },
    summary="Hangup/End Phone Call",
    description="""
    Terminates the current active phone call by deleting the LiveKit room.

    **How to use:**
    1. Send a POST request to `/hangup` (no body required)
    2. The system will automatically delete the current active room
    3. This ends the current call without needing to specify room name

    **Simple Usage:**
    - No parameters needed - just call the endpoint
    - Automatically finds and terminates the current active call
    - Perfect for a simple "Hang Up" button in your UI

    **What happens:**
    - Deletes the current active LiveKit room
    - Terminates all participants in the room
    - Ends the SIP call connection
    - Cleans up agent dispatch resources
    - Clears the active room tracker
    """,
)
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


@app.get(
    "/active_call",
    summary="Get Active Call Status",
    description="Check if there's currently an active call and get the room information",
)
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


@app.get(
    "/",
    summary="API Information",
    description="Get basic information about the Telephony Call Dispatcher API and available endpoints",
)
async def root():
    """Root endpoint with comprehensive API information and usage examples"""
    return {
        "service": "Telephony Call Dispatcher",
        "version": "1.0.0",
        "description": "API for dispatching outbound phone calls through LiveKit SIP integration",
        "endpoints": {
            "make_call": {
                "url": "/make_call",
                "method": "POST",
                "description": "Initiate an outbound phone call",
                "example_request": {"phone_number": "+1234567890"},
            },
            "hangup": {
                "url": "/hangup",
                "method": "POST",
                "description": "Hangup/terminate the current active call (no parameters needed)",
                "example_request": "No body required - just POST to /hangup",
            },
            "health": {
                "url": "/health",
                "method": "GET",
                "description": "Check service health status",
            },
            "docs": {
                "url": "/docs",
                "method": "GET",
                "description": "Interactive API documentation (Swagger UI)",
            },
            "redoc": {
                "url": "/redoc",
                "method": "GET",
                "description": "Alternative API documentation (ReDoc)",
            },
        },
        "phone_format": {
            "standard": "E.164",
            "description": "International phone number format with + and country code",
            "reference": "https://www.twilio.com/docs/glossary/what-e164",
            "examples": {
                "us_canada": "+1234567890",
                "uk": "+441234567890",
                "india": "+919876543210",
                "china": "+8613912345678",
            },
        },
        "usage_example": {
            "make_call": {
                "curl": "curl -X POST http://localhost:8000/make_call -H 'Content-Type: application/json' -d '{\"phone_number\": \"+1234567890\"}'",
                "python": "import requests\\nresponse = requests.post('http://localhost:8000/make_call', json={'phone_number': '+1234567890'})",
                "javascript": "fetch('http://localhost:8000/make_call', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({phone_number: '+1234567890'})})",
            },
            "hangup": {
                "curl": "curl -X POST http://localhost:8000/hangup -H 'Content-Type: application/json' -d '{\"room_name\": \"sip-a1b2c3d4\"}'",
                "python": "import requests\\nresponse = requests.post('http://localhost:8000/hangup', json={'room_name': 'sip-a1b2c3d4'})",
                "javascript": "fetch('http://localhost:8000/hangup', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({room_name: 'sip-a1b2c3d4'})})",
            },
        },
    }
