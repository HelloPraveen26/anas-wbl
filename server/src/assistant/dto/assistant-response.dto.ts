import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Assistant } from "../entities/assistant.entity";

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
    description: "UUID of the synthesizer voice being used",
    example: "123e4567-e89b-12d3-a456-426614174003",
  })
  synthesizerVoiceId: string;

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
    description: "Synthesizer voice details",
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      synthesizerModel: {
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
      },
    },
    required: false,
  })
  synthesizerVoice?: {
    id: string;
    name: string;
    synthesizerModel: {
      id: string;
      name: string;
      synthesizerProvider: {
        id: string;
        name: string;
      };
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

  constructor(assistant: Assistant) {
    this.id = assistant.id;
    this.name = assistant.name;
    this.firstMessage = assistant.firstMessage;
    this.systemPrompt = assistant.systemPrompt;
    this.llmModelId = assistant.llmModelId;
    this.transcriberModelId = assistant.transcriberModelId;
    this.synthesizerVoiceId = assistant.synthesizerVoiceId;
    this.sttConfig = assistant.sttConfig;
    this.ttsConfig = assistant.ttsConfig;
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

    if (assistant.synthesizerVoice) {
      this.synthesizerVoice = {
        id: assistant.synthesizerVoice.id,
        name: assistant.synthesizerVoice.name,
        synthesizerModel: {
          id: assistant.synthesizerVoice.synthesizerModel?.id,
          name: assistant.synthesizerVoice.synthesizerModel?.name,
          synthesizerProvider: {
            id: assistant.synthesizerVoice.synthesizerModel?.synthesizerProvider
              ?.id,
            name: assistant.synthesizerVoice.synthesizerModel
              ?.synthesizerProvider?.name,
          },
        },
      };
    }
  }
}
