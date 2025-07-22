import { Controller, Get, UseGuards, Query, HttpStatus } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  SynthesizerProvider,
  SynthesizerModel,
  SynthesizerVoice,
} from "./entities";

@ApiTags("synthesizer")
@Controller("synthesizer")
@UseGuards(ThrottlerGuard)
export class SynthesizerController {
  constructor(
    @InjectRepository(SynthesizerProvider)
    private synthesizerProviderRepository: Repository<SynthesizerProvider>,
    @InjectRepository(SynthesizerModel)
    private synthesizerModelRepository: Repository<SynthesizerModel>,
    @InjectRepository(SynthesizerVoice)
    private synthesizerVoiceRepository: Repository<SynthesizerVoice>,
  ) {}

  @Get("providers")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all synthesizer providers",
    description:
      "Retrieve all available synthesizer providers for dropdown selection",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Synthesizer providers retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
    },
    example: [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "ElevenLabs",
        isActive: true,
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174001",
        name: "OpenAI",
        isActive: true,
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async getProviders() {
    return this.synthesizerProviderRepository.find({
      where: { isActive: true },
      select: ["id", "name", "isActive"],
      order: { name: "ASC" },
    });
  }

  @Get("models")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get synthesizer models",
    description: "Retrieve synthesizer models, optionally filtered by provider",
  })
  @ApiQuery({
    name: "providerId",
    required: false,
    description: "Filter models by provider ID",
    type: "string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Synthesizer models retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          isActive: { type: "boolean" },
          synthesizerProvider: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
            },
          },
        },
      },
    },
    example: [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "TTS-1",
        isActive: true,
        synthesizerProvider: {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "OpenAI",
        },
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async getModels(@Query("providerId") providerId?: string) {
    const whereCondition: any = { isActive: true };

    if (providerId) {
      whereCondition.synthesizerProvider = { id: providerId };
    }

    return this.synthesizerModelRepository.find({
      where: whereCondition,
      relations: ["synthesizerProvider"],
      select: {
        id: true,
        name: true,
        isActive: true,
        synthesizerProvider: {
          id: true,
          name: true,
        },
      },
      order: { name: "ASC" },
    });
  }

  @Get("voices")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get synthesizer voices",
    description: "Retrieve synthesizer voices, optionally filtered by model",
  })
  @ApiQuery({
    name: "modelId",
    required: false,
    description: "Filter voices by model ID",
    type: "string",
  })
  @ApiQuery({
    name: "providerId",
    required: false,
    description: "Filter voices by provider ID",
    type: "string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Synthesizer voices retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          isActive: { type: "boolean" },
          synthesizerModel: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              synthesizerProvider: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    example: [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "alloy",
        isActive: true,
        synthesizerModel: {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "TTS-1",
          synthesizerProvider: {
            id: "123e4567-e89b-12d3-a456-426614174002",
            name: "OpenAI",
          },
        },
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async getVoices(
    @Query("modelId") modelId?: string,
    @Query("providerId") providerId?: string,
  ) {
    const whereCondition: any = { isActive: true };

    if (modelId) {
      whereCondition.synthesizerModel = { id: modelId };
    } else if (providerId) {
      whereCondition.synthesizerModel = {
        synthesizerProvider: { id: providerId },
      };
    }

    return this.synthesizerVoiceRepository.find({
      where: whereCondition,
      relations: ["synthesizerModel", "synthesizerModel.synthesizerProvider"],
      select: {
        id: true,
        name: true,
        isActive: true,
        synthesizerModel: {
          id: true,
          name: true,
          synthesizerProvider: {
            id: true,
            name: true,
          },
        },
      },
      order: { name: "ASC" },
    });
  }
}
