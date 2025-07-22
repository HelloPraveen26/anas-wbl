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
import { LlmProvider, LlmModel } from "./entities";

@ApiTags("llm")
@Controller("llm")
@UseGuards(ThrottlerGuard)
export class LlmController {
  constructor(
    @InjectRepository(LlmProvider)
    private llmProviderRepository: Repository<LlmProvider>,
    @InjectRepository(LlmModel)
    private llmModelRepository: Repository<LlmModel>,
  ) {}

  @Get("providers")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all LLM providers",
    description: "Retrieve all available LLM providers for dropdown selection",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "LLM providers retrieved successfully",
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
        name: "OpenAI",
        isActive: true,
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174001",
        name: "Anthropic",
        isActive: true,
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async getProviders() {
    return this.llmProviderRepository.find({
      where: { isActive: true },
      select: ["id", "name", "isActive"],
      order: { name: "ASC" },
    });
  }

  @Get("models")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get LLM models",
    description: "Retrieve LLM models, optionally filtered by provider",
  })
  @ApiQuery({
    name: "providerId",
    required: false,
    description: "Filter models by provider ID",
    type: "string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "LLM models retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          isActive: { type: "boolean" },
          llmProvider: {
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
        name: "GPT-4",
        isActive: true,
        llmProvider: {
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
      whereCondition.llmProvider = { id: providerId };
    }

    return this.llmModelRepository.find({
      where: whereCondition,
      relations: ["llmProvider"],
      select: {
        id: true,
        name: true,
        isActive: true,
        llmProvider: {
          id: true,
          name: true,
        },
      },
      order: { name: "ASC" },
    });
  }
}
