# Telephony Agent - Call Dispatcher Backend

A FastAPI-based telephony agent system that handles outbound phone calls through LiveKit SIP integration with E.164 phone number validation.

## Features

- **Outbound Call Initiation**: Make calls to any E.164 formatted phone number
- **Simple Call Management**: Easy hangup with a single API call (no parameters needed)
- **E.164 Phone Validation**: Comprehensive phone number format validation
- **LiveKit Integration**: Full SIP integration through LiveKit platform
- **Comprehensive API Documentation**: Auto-generated Swagger/OpenAPI docs
- **Health Monitoring**: Built-in health check endpoint

## Prerequisites

- Python >=3.13
- LiveKit server instance
- SIP trunk configuration
- Required environment variables (see Configuration section)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd telephony-agent
   ```

2. **Install dependencies using uv:**
   ```bash
   uv sync
   ```

3. **Activate the virtual environment:**
   ```bash
   source .venv/bin/activate
   ```

## Configuration

Create a `.env` file in the project root with the following variables:

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# SIP Configuration
SIP_OUTBOUND_TRUNK_ID=your_sip_trunk_id

# Deepgram Configuration
DEEPGRAM_API_KEY=

# OpenAI Configuration
OPENAI_API_KEY=

```

### Environment Variables

| Variable | Description
|----------|-------------|
| `LIVEKIT_URL` | Your LiveKit server URL |
| `LIVEKIT_API_KEY` | LiveKit API key | 
| `LIVEKIT_API_SECRET` | LiveKit API secret | 
| `SIP_OUTBOUND_TRUNK_ID` | SIP trunk identifier for outbound calls | 
| `DEEPGRAM_API_KEY` | API key for TTS and STT models | 
| `OPENAI_API_KEY` | API key for llm node | 


## Running the Application (for Development)

### FastAPI Server
```bash
cd call_dispatcher_backend
uvicorn main:app --reload --host 0.0.0.0 --port 8003
```

### LiveKit Server
```bash
cd agents
python agent.py dev
```

The API will be available at:
- **API Base**: `http://localhost:8000`
- **Interactive Docs**: `http://localhost:8000/docs`

## 📚 API Endpoints

### Core Endpoints

#### 1. Make Call
**POST** `/make_call`

Initiate an outbound phone call.

```bash
curl -X POST http://localhost:8000/make_call \
  -H 'Content-Type: application/json' \
  -d '{"phone_number": "+1234567890"}'
```

**Request Body:**
```json
{
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "room_name": "sip-a1b2c3d4",
  "phone_number": "+1234567890",
  "sip_details": { ... },
  "dispatch": { ... }
}
```

#### 2. Hangup Call
**POST** `/hangup`

Terminate the current active call (no parameters needed).

```bash
curl -X POST http://localhost:8000/hangup
```

**Response:**
```json
{
  "message": "Call ended successfully",
  "room_name": "sip-a1b2c3d4",
  "timestamp": "2025-09-25T10:30:00Z"
}
```

#### 3. Active Call Status
**GET** `/active_call`

Check if there's currently an active call.

```bash
curl http://localhost:8000/active_call
```

### 🔧 Utility Endpoints

#### Health Check
**GET** `/health`

```bash
curl http://localhost:8000/health
```

#### API Information
**GET** `/`

```bash
curl http://localhost:8000/
```

## Phone Number Format

### E.164 Standard
All phone numbers must follow the [E.164 international format](https://www.twilio.com/docs/glossary/what-e164):

- Must start with `+`
- Followed by country code (1-3 digits)
- Followed by national number
- Maximum 15 digits total (including country code)
- No spaces, dashes, or other formatting

### Examples
```
+1234567890     # US/Canada
+441234567890   # UK
+919876543210   # India
+8613912345678  # China
+49301234567    # Germany
+33123456789    # France
```

## Project Structure

```
telephony-agent/
├── call_dispatcher_backend/
│   └── main.py                 # FastAPI telephony-agent
├── agents/
│   └── agent.py               # LiveKit agent 
├── .env                       # Environment variables
├── .gitignore                # Git ignore rules
├── pyproject.toml            # Project dependencies
├── uv.lock                   # Lock file
└── README.md                 # This file
```

## Error Handling

### Common Error Responses

- **400 Bad Request**: Invalid phone number format or missing fields
- **404 Not Found**: No active call to hangup
- **500 Internal Server Error**: LiveKit connection issues or server errors

### Example Error Response
```json
{
  "detail": "Phone number must be in E.164 format: + followed by country code and number (1-15 digits total). Examples: +1234567890, +441234567890. Learn more: https://www.twilio.com/docs/glossary/what-e164"
}
```

## Logging

The application provides comprehensive logging:

- **INFO**: Successful operations, call initiation/termination
- **WARNING**: Non-critical issues, room deletion failures
- **ERROR**: Critical errors, connection failures


## Support

- **Documentation**: Check `/docs` endpoint for interactive API documentation
- **Issues**: Report issues on the project repository
- **Email**: [suguna@hexitetechnologies.com]
