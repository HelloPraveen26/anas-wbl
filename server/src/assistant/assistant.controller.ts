import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AssistantService } from "./assistant.service";
import {
  CreateAssistantDto,
  UpdateAssistantDto,
  AssistantResponseDto,
  CreateDefaultAssistantDto,
  ConnectionDetailsResponseDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("assistants")
@Controller("assistants")
@UseGuards(ThrottlerGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all user assistants",
    description: "Retrieve all assistants belonging to the authenticated user",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Assistants retrieved successfully",
    type: [AssistantResponseDto],
    example: [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Customer Service Assistant",
        firstMessage: "Hello! How can I help you today?",
        systemPrompt: "You are a helpful customer service assistant...",
        llmModelId: "123e4567-e89b-12d3-a456-426614174001",
        transcriberModelId: "123e4567-e89b-12d3-a456-426614174002",
        synthesizerModelId: "123e4567-e89b-12d3-a456-426614174003",
        isActive: true,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async findAll(@Request() req): Promise<AssistantResponseDto[]> {
    const assistants = await this.assistantService.findAll(req.user.id);

    // If no assistants exist, create a default one
    if (assistants.length === 0) {
      const defaultAssistant =
        await this.assistantService.createDefaultAssistant(req.user.id);
      return [defaultAssistant];
    }

    return assistants;
  }

  @Get("connection-details")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get LiveKit connection details",
    description:
      "Get connection details for establishing a LiveKit WebRTC connection including server URL, room name, and participant token",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Connection details retrieved successfully",
    type: ConnectionDetailsResponseDto,
    example: {
      serverUrl: "wss://livekit.zenxai.io/",
      roomName: "voice_assistant_room_8658",
      participantToken:
        "eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidXNlciIsInZpZGVvIjp7InJvb20iOiJ2b2ljZV9hc3Npc3RhbnRfcm9vbV84NjU4Iiwicm9vbUpvaW4iOnRydWUsImNhblB1Ymxpc2giOnRydWUsImNhblB1Ymxpc2hEYXRhIjp0cnVlLCJjYW5TdWJzY3JpYmUiOnRydWV9LCJpc3MiOiJkZXZrZXkiLCJleHAiOjE3NTQ0NTAyMjUsIm5iZiI6MCwic3ViIjoidm9pY2VfYXNzaXN0YW50X3VzZXJfNDc5MSJ9.jHsZetGaLzKaIlbhtq7x8Y3MC8Ab7x-HqKy5TMZBlLQ",
      participantName: "user",
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "LiveKit configuration is missing",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async getConnectionDetails(
    @Request() req,
  ): Promise<ConnectionDetailsResponseDto> {
    const response = await this.assistantService.getConnectionDetails();

    // Set no-cache headers
    req.res.set("Cache-Control", "no-store");

    return response;
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get assistant by ID",
    description: "Retrieve a specific assistant by its ID",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the assistant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Assistant retrieved successfully",
    type: AssistantResponseDto,
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Customer Service Assistant",
      firstMessage: "Hello! How can I help you today?",
      systemPrompt: "You are a helpful customer service assistant...",
      llmModelId: "123e4567-e89b-12d3-a456-426614174001",
      transcriberModelId: "123e4567-e89b-12d3-a456-426614174002",
      synthesizerModelId: "123e4567-e89b-12d3-a456-426614174003",
      isActive: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Assistant not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<AssistantResponseDto> {
    return this.assistantService.findOne(id, req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create new assistant",
    description: "Create a new assistant for the authenticated user",
  })
  @ApiBody({ type: CreateAssistantDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Assistant created successfully",
    type: AssistantResponseDto,
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Customer Service Assistant",
      firstMessage: "Hello! How can I help you today?",
      systemPrompt: "You are a helpful customer service assistant...",
      llmModelId: "123e4567-e89b-12d3-a456-426614174001",
      transcriberModelId: "123e4567-e89b-12d3-a456-426614174002",
      synthesizerModelId: "123e4567-e89b-12d3-a456-426614174003",
      isActive: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Bad request - validation failed",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async create(
    @Body() createAssistantDto: CreateAssistantDto,
    @Request() req,
  ): Promise<AssistantResponseDto> {
    return this.assistantService.create(req.user.id, createAssistantDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update assistant",
    description: "Update an existing assistant",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the assistant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiBody({ type: UpdateAssistantDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Assistant updated successfully",
    type: AssistantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Bad request - validation failed",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Assistant not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateAssistantDto: UpdateAssistantDto,
    @Request() req,
  ): Promise<AssistantResponseDto> {
    return this.assistantService.update(id, req.user.id, updateAssistantDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Delete assistant",
    description: "Delete an assistant (soft delete)",
  })
  @ApiParam({
    name: "id",
    description: "UUID of the assistant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Assistant deleted successfully",
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Assistant deleted successfully" },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Assistant not found",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.assistantService.remove(id, req.user.id);
    return { message: "Assistant deleted successfully" };
  }

  @Post("default")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create default assistant",
    description: "Create a default assistant with pre-configured settings",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Default assistant created successfully",
    type: AssistantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Required models not available",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async createDefault(@Request() req): Promise<AssistantResponseDto> {
    return this.assistantService.createDefaultAssistant(req.user.id);
  }

  @Post("create-with-name")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create assistant with custom name and default settings",
    description:
      "Create an assistant with a custom name using default model, voice, and transcriber",
  })
  @ApiBody({ type: CreateDefaultAssistantDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Assistant created successfully with default settings",
    type: AssistantResponseDto,
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "My Custom Assistant",
      firstMessage: "Hello! How can I help you today?",
      systemPrompt:
        "You are a helpful AI assistant. Be friendly, concise, and helpful in your responses.",
      llmModelId: "123e4567-e89b-12d3-a456-426614174001",
      transcriberModelId: "123e4567-e89b-12d3-a456-426614174002",
      synthesizerModelId: "123e4567-e89b-12d3-a456-426614174003",
      isActive: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      "Bad request - validation failed or required models not available",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  async createWithCustomName(
    @Body() createDefaultAssistantDto: CreateDefaultAssistantDto,
    @Request() req,
  ): Promise<AssistantResponseDto> {
    return this.assistantService.createDefaultAssistant(
      req.user.id,
      createDefaultAssistantDto.name,
    );
  }
}
