# RegisteredNumbers Module

This module manages registered phone numbers for users in the Zenvoice application. It provides full CRUD functionality for managing phone numbers that can be used for voice calls.

## Features

- **Create** new registered phone numbers
- **Read** all registered numbers for a user
- **Update** existing registered numbers
- **Delete** registered numbers
- **Authentication** protected endpoints
- **Swagger** documentation
- **Validation** for phone numbers in E.164 format

## Entity Structure

The `RegisteredNumber` entity includes the following fields:

- `id` - UUID primary key
- `providerName` - Phone service provider (e.g., "twilio")
- `friendlyName` - Human-readable name for the number
- `phoneNo` - Phone number in E.164 format (e.g., "+19282185402")
- `livekitOutboundTrunkId` - LiveKit trunk ID for outbound calls
- `active` - Boolean flag for number status (default: true)
- `userId` - Foreign key to the user who owns this number
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## API Endpoints

All endpoints are protected with JWT authentication and require a valid bearer token.

### Base URL: `/api/v1/registered-numbers`

#### 1. Create Registered Number
- **Method:** `POST /`
- **Body:** `CreateRegisteredNumberDto`
- **Response:** `RegisteredNumberResponseDto`

#### 2. Get All Registered Numbers
- **Method:** `GET /`
- **Response:** `RegisteredNumberResponseDto[]`

#### 3. Get Registered Number by ID
- **Method:** `GET /:id`
- **Parameters:** `id` (UUID)
- **Response:** `RegisteredNumberResponseDto`

#### 4. Update Registered Number
- **Method:** `PATCH /:id`
- **Parameters:** `id` (UUID)
- **Body:** `UpdateRegisteredNumberDto`
- **Response:** `RegisteredNumberResponseDto`

#### 5. Delete Registered Number
- **Method:** `DELETE /:id`
- **Parameters:** `id` (UUID)
- **Response:** Success message

## DTOs

### CreateRegisteredNumberDto
```typescript
{
  providerName: string;      // Required, max 100 chars
  friendlyName: string;      // Required, max 255 chars
  phoneNo: string;          // Required, E.164 format
  livekitOutboundTrunkId: string; // Required, max 255 chars
  active?: boolean;         // Optional, defaults to true
}
```

### UpdateRegisteredNumberDto
All fields are optional versions of the create DTO.

### RegisteredNumberResponseDto
```typescript
{
  id: string;
  providerName: string;
  friendlyName: string;
  phoneNo: string;
  livekitOutboundTrunkId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Validation

- **Phone Number:** Must be in E.164 format (regex: `^\+[1-9]\d{1,14}$`)
- **Provider Name:** 1-100 characters
- **Friendly Name:** 1-255 characters
- **LiveKit Trunk ID:** 1-255 characters

## Database

The module uses TypeORM with PostgreSQL. The table `registered_numbers` has a foreign key relationship to the `users` table.

### Migration
A migration file is generated to create the table structure.

### Seed Data
The seed includes a sample registered number:
- Provider: "twilio"
- Friendly Name: "Balaji k"
- Phone: "+19282185402"
- LiveKit Trunk ID: "ST_xn9xEW6gFR3R"

## Security

- All endpoints require JWT authentication
- Users can only access their own registered numbers
- Input validation prevents malformed data
- Rate limiting is applied via ThrottlerGuard

## Usage Example

```bash
# Create a new registered number
curl -X POST http://localhost:8000/api/v1/registered-numbers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "providerName": "twilio",
    "friendlyName": "My Business Line",
    "phoneNo": "+15551234567",
    "livekitOutboundTrunkId": "ST_abc123xyz"
  }'

# Get all registered numbers
curl -X GET http://localhost:8000/api/v1/registered-numbers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Integration

The module is automatically:
- Registered in `AppModule`
- Added to TypeORM entities in `data-source.ts`
- Documented in Swagger at `/api/docs`
- Seeded when running `npm run seed`

## File Structure

```
src/registered-numbers/
├── dto/
│   ├── create-registered-number.dto.ts
│   ├── update-registered-number.dto.ts
│   └── registered-number-response.dto.ts
├── entities/
│   └── registered-number.entity.ts
├── registered-numbers.controller.ts
├── registered-numbers.service.ts
├── registered-numbers.module.ts
├── index.ts
└── README.md
```
