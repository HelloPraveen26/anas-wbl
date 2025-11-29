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
  BadRequestException,
  NotFoundException,
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
import { promises as fs } from "fs";
import { join } from "path";
import axios from "axios";

@ApiTags("assistants")
@Controller("assistants")
@UseGuards(ThrottlerGuard)
export class AssistantController {
  // 🔧 TOOLS: Config directory for storing tool configurations
  private readonly configDir = join(process.cwd(), "assistant_configs");

  constructor(private readonly assistantService: AssistantService) {
    // Ensure config directory exists on startup
    this.initConfigDirectory();
  }

  // 🔧 TOOLS: Initialize config directory
  private async initConfigDirectory() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
      console.log("✅ Assistant config directory ready:", this.configDir);
    } catch (error) {
      console.error("❌ Error creating config directory:", error);
    }
  }

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
    @Request() req
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
    @Request() req
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
    @Request() req
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
    @Request() req
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
    @Request() req
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
    @Request() req
  ): Promise<AssistantResponseDto> {
    return this.assistantService.createDefaultAssistant(
      req.user.id,
      createDefaultAssistantDto.name
    );
  }

  // ============================
  // 🔧 TOOLS CONFIGURATION (MERGED)
  // ============================

  @Post("save-tool-config")
  @ApiOperation({
    summary: "Save tool configuration",
    description:
      "Save custom tool configuration for an assistant with file persistence",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        toolName: { type: "string", example: "function_tool" },
        description: {
          type: "string",
          example: "Describe the tool in a few sentences",
        },
        assistantId: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
        webhookUrl: { type: "string", example: "https://api.example.com/function" },
        timeout: { type: "number", example: 20 },
        isAsync: { type: "boolean", example: true },
        isStrict: { type: "boolean", example: true },
        parameters: { type: "object", example: {} },
        httpHeaders: { type: "object", example: {} },
        messages: { type: "object", example: {} },
        conditions: { type: "array", example: [] },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Tool configuration saved successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Bad request - validation failed",
  })
  async saveToolConfig(@Body() toolConfig: any): Promise<any> {
    try {
      const { assistantId, ...config } = toolConfig;

      if (!assistantId) {
        throw new BadRequestException("assistantId is required");
      }

      if (!config.webhookUrl) {
        throw new BadRequestException("webhookUrl is required");
      }

      // Save to file
      const filePath = join(this.configDir, `${assistantId}.json`);
      await fs.writeFile(filePath, JSON.stringify(config, null, 2), "utf-8");

      console.log("=============================================");
      console.log("✅ Tool configuration saved successfully");
      console.log("📋 Tool Name:", toolConfig.toolName);
      console.log("🔗 Webhook URL:", toolConfig.webhookUrl);
      console.log("🆔 Assistant ID:", assistantId);
      console.log("📂 File path:", filePath);
      console.log("=============================================");

      return {
        success: true,
        message: "Tool configuration saved successfully",
        data: {
          toolName: toolConfig.toolName,
          description: toolConfig.description,
          assistantId: assistantId,
          webhookUrl: toolConfig.webhookUrl,
          timeout: toolConfig.timeout,
          isAsync: toolConfig.isAsync,
          isStrict: toolConfig.isStrict,
          parametersCount: Object.keys(toolConfig.parameters || {}).length,
          headersCount: Object.keys(toolConfig.httpHeaders || {}).length,
          conditionsCount: (toolConfig.conditions || []).length,
          savedAt: new Date().toISOString(),
          filePath: filePath,
        },
      };
    } catch (error) {
      console.error("❌ Error saving tool config:", error);
      throw error;
    }
  }

  @Get("tool-config/:assistantId")
  @ApiOperation({
    summary: "Get tool configuration",
    description: "Retrieve saved tool configuration for an assistant",
  })
  @ApiParam({
    name: "assistantId",
    description: "UUID of the assistant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Configuration retrieved successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          description: "Tool configuration object",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Configuration not found",
  })
  async getToolConfig(@Param("assistantId") assistantId: string): Promise<any> {
    try {
      const filePath = join(this.configDir, `${assistantId}.json`);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        console.log(
          `ℹ️ No configuration found for assistant: ${assistantId}`
        );
        return {
          success: false,
          message: `No tool configuration found for assistant ${assistantId}`,
        };
      }

      // Read and parse config
      const configData = await fs.readFile(filePath, "utf-8");
      const config = JSON.parse(configData);

      console.log("=============================================");
      console.log("✅ Tool configuration loaded successfully");
      console.log("🆔 Assistant ID:", assistantId);
      console.log("📋 Tool Name:", config.toolName);
      console.log("📂 File path:", filePath);
      console.log("=============================================");

      return {
        success: true,
        data: config,
      };
    } catch (error) {
      console.error("❌ Error loading tool config:", error);
      throw new NotFoundException(
        `Failed to load configuration for assistant: ${assistantId}`
      );
    }
  }

  @Post("agent-webhook")
  @ApiOperation({
    summary: "Agent webhook endpoint",
    description:
      "Receives collected data from the agent and forwards to configured webhook",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        assistantId: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
        collectedData: {
          type: "object",
          example: {
            name: "John Doe",
            email: "john@example.com",
            phone: "+1234567890",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Data forwarded successfully",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Missing required fields",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Configuration not found for assistant",
  })
  async agentWebhook(@Body() payload: any): Promise<any> {
    try {
      const { assistantId, collectedData } = payload;

      if (!assistantId) {
        throw new BadRequestException("assistantId is required");
      }

      if (!collectedData) {
        throw new BadRequestException("collectedData is required");
      }

      // Read config file
      const filePath = join(this.configDir, `${assistantId}.json`);

      let configData: string;
      try {
        configData = await fs.readFile(filePath, "utf-8");
      } catch (error) {
        throw new NotFoundException(
          `No configuration found for assistant: ${assistantId}`
        );
      }

      const config = JSON.parse(configData);
      const { webhookUrl } = config;

      if (!webhookUrl) {
        throw new BadRequestException(
          "Webhook URL not defined in configuration"
        );
      }

      console.log("=============================================");
      console.log(`📤 Forwarding data to webhook`);
      console.log(`🆔 Assistant ID: ${assistantId}`);
      console.log(`🔗 Webhook URL: ${webhookUrl}`);
      console.log(
        `📊 Collected Data:`,
        JSON.stringify(collectedData, null, 2)
      );
      console.log("=============================================");

      // Forward to webhook
      const webhookPayload = {
        assistantId,
        data: collectedData,
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(webhookUrl, webhookPayload, {
        headers: {
          "Content-Type": "application/json",
          ...config.httpHeaders, // Include any custom headers from config
        },
        timeout: (config.timeout || 20) * 1000, // Convert to milliseconds
      });

      console.log(
        `✅ Data sent successfully to webhook (Status: ${response.status})`
      );

      return {
        success: true,
        message: "Data forwarded to webhook successfully",
        webhookResponse: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    } catch (error) {
      console.error("❌ Agent webhook forwarding error:", error.message);

      if (error.response) {
        console.error("Webhook response error:", {
          status: error.response.status,
          data: error.response.data,
        });
      }

      throw error;
    }
  }
}