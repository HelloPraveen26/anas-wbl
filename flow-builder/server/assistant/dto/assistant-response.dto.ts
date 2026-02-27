import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Assistant } from "../entities/assistant.entity";
import { File } from "../../file-storage/entities/file.entity";

export class AssistantResponseDto {
  @ApiProperty({
    description: "Unique identifier of the assistant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Name of the assistant",
    example: "Customer Service Assistant",
  })
  name: string;

  @ApiProperty({
    description: "First message the assistant will send",
    example: "Hello! How can I help you today?",
  })
  firstMessage: string;

  @ApiProperty({
    description: "System prompt that defines assistant behavior",
    example: "You are a helpful customer service assistant...",
  })
  systemPrompt: string;

  @ApiProperty({
    description: "UUID of the LLM model being used",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  llmModelId: string;

  @ApiProperty({
    description: "UUID of the transcriber model being used",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  transcriberModelId: string;

  @ApiProperty({
    description: "UUID of the synthesizer model being used",
    example: "123e4567-e89b-12d3-a456-426614174003",
  })
  synthesizerModelId: string;

  @ApiPropertyOptional({
    description: "UUID of the realtime model being used",
    example: "123e4567-e89b-12d3-a456-426614174004",
  })
  realtimeModelId?: string;

  @ApiPropertyOptional({
    description: "STT (Speech-to-Text) configuration for transcriber",
    example: { language: "hi-IN" },
    type: "object",
  })
  sttConfig?: Record<string, any>;

  @ApiPropertyOptional({
    description: "TTS (Text-to-Speech) configuration for synthesizer",
    example: { speaker: "anushka" },
    type: "object",
  })
  ttsConfig?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Realtime configuration for realtime model",
    example: { temperature: 0.7, voice: "alloy" },
    type: "object",
  })
  realtimeConfig?: Record<string, any>;

  @ApiProperty({
    description: "Whether the assistant is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "LLM model details",
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      llmProvider: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
    },
    required: false,
  })
  llmModel?: {
    id: string;
    name: string;
    llmProvider: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    description: "Transcriber model details",
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      transcriberProvider: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
    },
    required: false,
  })
  transcriberModel?: {
    id: string;
    name: string;
    transcriberProvider: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    description: "Synthesizer model details",
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      synthesizerProvider: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
    },
    required: false,
  })
  synthesizerModel?: {
    id: string;
    name: string;
    synthesizerProvider: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    description: "Realtime model details",
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      realtimeProvider: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
    },
    required: false,
  })
  realtimeModel?: {
    id: string;
    name: string;
    realtimeProvider: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: "List of knowledgebase files associated with the assistant",
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        originalName: { type: "string" },
        storedName: { type: "string" },
        filePath: { type: "string" },
        mimeType: { type: "string" },
        fileSize: { type: "number" },
        isActive: { type: "boolean" },
      },
    },
  })
  files?: File[];

  constructor(assistant: Assistant) {
    this.id = assistant.id;
    this.name = assistant.name;
    this.firstMessage = assistant.firstMessage;
    this.systemPrompt = assistant.systemPrompt;
    this.llmModelId = assistant.llmModelId;
    this.transcriberModelId = assistant.transcriberModelId;
    this.synthesizerModelId = assistant.synthesizerModelId;
    this.realtimeModelId = assistant.realtimeModelId;
    this.sttConfig = assistant.sttConfig;
    this.ttsConfig = assistant.ttsConfig;
    this.realtimeConfig = assistant.realtimeConfig;
    this.isActive = assistant.isActive;
    this.createdAt = assistant.createdAt;
    this.updatedAt = assistant.updatedAt;

    // Include related entities if they're loaded
    if (assistant.llmModel) {
      this.llmModel = {
        id: assistant.llmModel.id,
        name: assistant.llmModel.name,
        llmProvider: {
          id: assistant.llmModel.llmProvider?.id,
          name: assistant.llmModel.llmProvider?.name,
        },
      };
    }

    if (assistant.transcriberModel) {
      this.transcriberModel = {
        id: assistant.transcriberModel.id,
        name: assistant.transcriberModel.name,
        transcriberProvider: {
          id: assistant.transcriberModel.transcriberProvider?.id,
          name: assistant.transcriberModel.transcriberProvider?.name,
        },
      };
    }

    if (assistant.synthesizerModel) {
      this.synthesizerModel = {
        id: assistant.synthesizerModel.id,
        name: assistant.synthesizerModel.name,
        synthesizerProvider: {
          id: assistant.synthesizerModel.synthesizerProvider?.id,
          name: assistant.synthesizerModel.synthesizerProvider?.name,
        },
      };
    }

    if (assistant.realtimeModel) {
      this.realtimeModel = {
        id: assistant.realtimeModel.id,
        name: assistant.realtimeModel.name,
        realtimeProvider: {
          id: assistant.realtimeModel.realtimeProvider?.id,
          name: assistant.realtimeModel.realtimeProvider?.name,
        },
      };
    }

    if (assistant.files) {
      this.files = assistant.files;
    }
  }
}
