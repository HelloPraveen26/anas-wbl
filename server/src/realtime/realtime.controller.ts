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
import { RealtimeProvider, RealtimeModel, RealtimeConfig } from "./entities";
import { RealtimeProviderResponseDto } from "./dto/realtime-provider-response.dto";
import { RealtimeModelResponseDto } from "./dto/realtime-model-response.dto";
import { RealtimeConfigResponseDto } from "./dto/realtime-config-response.dto";

@ApiTags("realtime")
@Controller("realtime")
@UseGuards(ThrottlerGuard)
export class RealtimeController {
  constructor(
    @InjectRepository(RealtimeProvider)
    private realtimeProviderRepository: Repository<RealtimeProvider>,
    @InjectRepository(RealtimeModel)
    private realtimeModelRepository: Repository<RealtimeModel>,
    @InjectRepository(RealtimeConfig)
    private realtimeConfigRepository: Repository<RealtimeConfig>,
  ) {}

  @Get("providers")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all realtime providers",
    description:
      "Retrieve all available realtime providers for dropdown selection",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Realtime providers retrieved successfully",
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
        name: "OpenAI Realtime",
        isActive: true,
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174001",
        name: "Azure Realtime",
        isActive: true,
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async getProviders(): Promise<RealtimeProviderResponseDto[]> {
    const providers = await this.realtimeProviderRepository.find({
      where: { isActive: true },
      select: ["id", "name", "isActive", "createdAt", "updatedAt"],
      order: { name: "ASC" },
    });
    return providers.map(
      (provider) => new RealtimeProviderResponseDto(provider),
    );
  }

  @Get("models")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get realtime models",
    description: "Retrieve realtime models, optionally filtered by provider",
  })
  @ApiQuery({
    name: "providerId",
    required: false,
    description: "Filter models by provider ID",
    type: "string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Realtime models retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          isActive: { type: "boolean" },
          realtimeProvider: {
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
        name: "gpt-4o-realtime-preview",
        isActive: true,
        realtimeProvider: {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "OpenAI Realtime",
        },
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async getModels(
    @Query("providerId") providerId?: string,
  ): Promise<RealtimeModelResponseDto[]> {
    const whereCondition: any = { isActive: true };

    if (providerId) {
      whereCondition.realtimeProvider = { id: providerId };
    }

    const models = await this.realtimeModelRepository.find({
      where: whereCondition,
      relations: ["realtimeProvider"],
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        realtimeProvider: {
          id: true,
          name: true,
        },
      },
      order: { name: "ASC" },
    });
    return models.map((model) => new RealtimeModelResponseDto(model));
  }

  @Get("configs")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get realtime configs",
    description:
      "Retrieve realtime configuration options, optionally filtered by provider",
  })
  @ApiQuery({
    name: "providerId",
    required: false,
    description: "Filter configs by provider ID",
    type: "string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Realtime configs retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          label: { type: "string" },
          key: { type: "string" },
          type: {
            type: "string",
            enum: ["string", "number", "boolean", "select"],
          },
          list: {
            type: "array",
            items: {
              type: "object",
              properties: {
                displayName: { type: "string" },
                value: { type: "string" },
              },
            },
            nullable: true,
          },
          defaultValue: { type: "string", nullable: true },
          active: { type: "boolean" },
          realtimeProvider: {
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
        label: "Temperature",
        key: "temperature",
        type: "number",
        list: null,
        defaultValue: "0.7",
        active: true,
        realtimeProvider: {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "OpenAI Realtime",
        },
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174002",
        label: "Voice",
        key: "voice",
        type: "select",
        list: [
          { displayName: "Alloy", value: "alloy" },
          { displayName: "Echo", value: "echo" },
          { displayName: "Fable", value: "fable" },
          { displayName: "Onyx", value: "onyx" },
          { displayName: "Nova", value: "nova" },
          { displayName: "Shimmer", value: "shimmer" },
        ],
        defaultValue: "alloy",
        active: true,
        realtimeProvider: {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "OpenAI Realtime",
        },
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async getRealtimeConfigs(
    @Query("providerId") providerId?: string,
  ): Promise<RealtimeConfigResponseDto[]> {
    const whereCondition: any = { active: true };

    if (providerId) {
      whereCondition.realtimeProvider = { id: providerId };
    }

    const configs = await this.realtimeConfigRepository.find({
      where: whereCondition,
      relations: ["realtimeProvider"],
      select: {
        id: true,
        label: true,
        key: true,
        type: true,
        list: true,
        defaultValue: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        realtimeProvider: {
          id: true,
          name: true,
        },
      },
      order: { label: "ASC" },
    });
    return configs.map((config) => new RealtimeConfigResponseDto(config));
  }
}
