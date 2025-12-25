# Realtime Provider System

This module provides a flexible configuration system for realtime AI providers (like OpenAI's Realtime API) within the voice assistant platform.

## Overview

The realtime provider system consists of three main entities:

1. **RealtimeProvider** - The service provider (e.g., "OpenAI Realtime", "Azure Realtime")
2. **RealtimeModel** - Specific models offered by providers (e.g., "gpt-4o-realtime-preview")
3. **RealtimeConfig** - Configuration options for each provider (e.g., temperature, voice, audio format)

## Architecture

### Entities

#### RealtimeProvider
- `id`: UUID primary key
- `name`: Provider name (unique)
- `isActive`: Whether the provider is active

#### RealtimeModel
- `id`: UUID primary key
- `name`: Model name
- `isActive`: Whether the model is active
- `realtimeProviderId`: Foreign key to RealtimeProvider

#### RealtimeConfig
- `id`: UUID primary key
- `label`: Display label for UI
- `key`: Configuration key for API
- `type`: Field type (string, number, boolean, select)
- `list`: JSON array for select options
- `defaultValue`: Default value
- `active`: Whether the config is active
- `realtimeProviderId`: Foreign key to RealtimeProvider

### Configuration Field Types

```typescript
enum ConfigFieldType {
  STRING = 'string',    // Text input
  NUMBER = 'number',    // Numeric input
  BOOLEAN = 'boolean',  // Checkbox/toggle
  SELECT = 'select',    // Dropdown with predefined options
}
```

## API Endpoints

### GET /realtime/providers
Returns all active realtime providers.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "OpenAI Realtime",
    "isActive": true
  }
]
```

### GET /realtime/models?providerId={uuid}
Returns realtime models, optionally filtered by provider.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440011",
    "name": "gpt-4o-realtime-preview",
    "isActive": true,
    "realtimeProvider": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "OpenAI Realtime"
    }
  }
]
```

### GET /realtime/configs?providerId={uuid}
Returns realtime configuration options, optionally filtered by provider.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440023",
    "label": "Voice",
    "key": "voice",
    "type": "select",
    "list": [
      {"displayName": "Alloy", "value": "alloy"},
      {"displayName": "Echo", "value": "echo"},
      {"displayName": "Fable", "value": "fable"}
    ],
    "defaultValue": "alloy",
    "active": true,
    "realtimeProvider": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "OpenAI Realtime"
    }
  }
]
```

## Integration with Assistants

Assistants can now optionally use realtime models:

### New Assistant Fields
- `realtimeModelId`: UUID (optional) - Reference to RealtimeModel
- `realtimeConfig`: JSON object - Configuration values for the realtime provider

### Example Assistant with Realtime Config
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Realtime Assistant",
  "realtimeModelId": "550e8400-e29b-41d4-a716-446655440011",
  "realtimeConfig": {
    "temperature": 0.7,
    "voice": "alloy",
    "max_response_output_tokens": 4096,
    "turn_detection_type": "server_vad"
  }
}
```

## Database Setup

Run the migration to create the required tables:

```bash
# Run TypeORM migration
npm run migration:run

# Or manually run the migration class
# The migration file is located at: src/database/migrations/1761281000000-CreateRealtimeProviderSystem.ts
```

## Usage Examples

### Frontend Integration

```typescript
// Fetch realtime providers
const providers = await fetch('/api/realtime/providers');

// Fetch models for a specific provider
const models = await fetch('/api/realtime/models?providerId=550e8400-e29b-41d4-a716-446655440001');

// Fetch config options for a provider
const configs = await fetch('/api/realtime/configs?providerId=550e8400-e29b-41d4-a716-446655440001');

// Create assistant with realtime model
const assistant = await fetch('/api/assistants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Realtime Assistant',
    realtimeModelId: '550e8400-e29b-41d4-a716-446655440011',
    realtimeConfig: {
      temperature: 0.8,
      voice: 'nova',
      max_response_output_tokens: 2048
    }
    // ... other required fields
  })
});
```

### Backend Service Usage

```typescript
import { RealtimeService } from './realtime.service';

@Injectable()
export class SomeService {
  constructor(private realtimeService: RealtimeService) {}

  async getRealtimeOptions() {
    const providers = await this.realtimeService.findAllProviders();
    const models = await this.realtimeService.findAllModels();
    const configs = await this.realtimeService.findAllConfigs();
    
    return { providers, models, configs };
  }
}
```

## Sample Data

The migration includes sample data for OpenAI Realtime API:

### Provider
- OpenAI Realtime
- Azure Realtime

### Models
- gpt-4o-realtime-preview
- gpt-4o-realtime-preview-2024-10-01

### Common Configuration Options
- **Temperature**: Controls randomness (0.0-2.0)
- **Voice**: Voice selection (alloy, echo, fable, onyx, nova, shimmer)
- **Max Response Output Tokens**: Maximum tokens in response
- **Audio Formats**: Input/output audio format options
- **Turn Detection**: Voice activity detection settings
- **VAD Settings**: Voice activity detection parameters

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Users can only access their own assistant configurations
3. **Validation**: Input validation on all configuration values
4. **Rate Limiting**: Throttling applied to prevent abuse

## Future Enhancements

1. **Provider-specific validation**: Validate config values based on provider requirements
2. **Config templates**: Pre-defined configuration templates for common use cases
3. **Config versioning**: Support for multiple versions of provider configurations
4. **Real-time config updates**: Hot-reload configuration changes without restart
5. **Usage analytics**: Track which configurations perform best