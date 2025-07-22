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
import { TranscriberProvider, TranscriberModel } from "./entities";

@ApiTags("transcriber")
@Controller("transcriber")
@UseGuards(ThrottlerGuard)
export class TranscriberController {
  constructor(
    @InjectRepository(TranscriberProvider)
    private transcriberProviderRepository: Repository<TranscriberProvider>,
    @InjectRepository(TranscriberModel)
    private transcriberModelRepository: Repository<TranscriberModel>,
  ) {}

  @Get("providers")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all transcriber providers",
    description:
      "Retrieve all available transcriber providers for dropdown selection",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Transcriber providers retrieved successfully",
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
        name: "Google",
        isActive: true,
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async getProviders() {
    return this.transcriberProviderRepository.find({
      where: { isActive: true },
      select: ["id", "name", "isActive"],
      order: { name: "ASC" },
    });
  }

  @Get("models")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get transcriber models",
    description: "Retrieve transcriber models, optionally filtered by provider",
  })
  @ApiQuery({
    name: "providerId",
    required: false,
    description: "Filter models by provider ID",
    type: "string",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Transcriber models retrieved successfully",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          isActive: { type: "boolean" },
          transcriberProvider: {
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
        name: "whisper-1",
        isActive: true,
        transcriberProvider: {
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
      whereCondition.transcriberProvider = { id: providerId };
    }

    return this.transcriberModelRepository.find({
      where: whereCondition,
      relations: ["transcriberProvider"],
      select: {
        id: true,
        name: true,
        isActive: true,
        transcriberProvider: {
          id: true,
          name: true,
        },
      },
      order: { name: "ASC" },
    });
  }
}
