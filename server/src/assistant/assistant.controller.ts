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
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
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
import axios from "axios";
import { ToolConfig } from "./entities/tool-config.entity";

@ApiTags("assistants")
@Controller("assistants")
@UseGuards(ThrottlerGuard)
export class AssistantController {
  constructor(
    private readonly assistantService: AssistantService,
    @InjectRepository(ToolConfig)
    private readonly toolConfigRepository: Repository<ToolConfig>
  ) { }

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
    summary: "Save tool configuration (supports multiple tools per assistant)",
    description: "Add or update a tool for an assistant without overwriting existing tools",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        toolName: { type: "string", example: "function_tool" },
        description: { type: "string", example: "Describe the tool" },
        assistantId: { type: "string", example: "123e4567-e89b-12d3-a456-426614174000" },
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
  async saveToolConfig(@Body() toolConfig: any): Promise<any> {
    try {
      const { assistantId, ...newToolConfig } = toolConfig;

      if (!assistantId) {
        throw new BadRequestException("assistantId is required");
      }

      if (!newToolConfig.webhookUrl) {
        throw new BadRequestException("webhookUrl is required");
      }

      if (!newToolConfig.toolName) {
        throw new BadRequestException("toolName is required");
      }

      // 🆕 Check if tool with same name exists for this assistant
      let dbTool = await this.toolConfigRepository.findOne({
        where: {
          assistantId: assistantId,
          toolName: newToolConfig.toolName,
        },
      });

      if (dbTool) {
        // Update existing tool
        console.log(`📝 Updating existing tool in DB: ${newToolConfig.toolName}`);
        dbTool.description = newToolConfig.description;
        dbTool.webhookUrl = newToolConfig.webhookUrl;
        dbTool.timeout = newToolConfig.timeout;
        dbTool.isAsync = newToolConfig.isAsync;
        dbTool.isStrict = newToolConfig.isStrict;
        dbTool.parameters = newToolConfig.parameters || {};
        dbTool.httpHeaders = newToolConfig.httpHeaders || {};
        dbTool.conditions = newToolConfig.conditions || [];
        await this.toolConfigRepository.save(dbTool);
      } else {
        // Add new tool
        console.log(`➕ Adding new tool to DB: ${newToolConfig.toolName}`);
        dbTool = this.toolConfigRepository.create({
          assistantId,
          toolName: newToolConfig.toolName,
          description: newToolConfig.description,
          webhookUrl: newToolConfig.webhookUrl,
          timeout: newToolConfig.timeout,
          isAsync: newToolConfig.isAsync,
          isStrict: newToolConfig.isStrict,
          parameters: newToolConfig.parameters || {},
          httpHeaders: newToolConfig.httpHeaders || {},
          conditions: newToolConfig.conditions || [],
        });
        await this.toolConfigRepository.save(dbTool);
      }

      // Get count of total tools for this assistant
      const totalTools = await this.toolConfigRepository.count({
        where: { assistantId },
      });

      console.log("=============================================");
      console.log("✅ Tool configuration saved to database");
      console.log("📋 Tool Name:", newToolConfig.toolName);
      console.log("🔗 Webhook URL:", newToolConfig.webhookUrl);
      console.log("🆔 Assistant ID:", assistantId);
      console.log("📊 Total tools for this assistant:", totalTools);
      console.log("=============================================");

      return {
        success: true,
        message: "Tool configuration saved successfully",
        data: {
          id: dbTool.id,
          toolName: newToolConfig.toolName,
          assistantId: assistantId,
          totalTools: totalTools,
          savedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ Error saving tool config to DB:", error);
      throw error;
    }
  }

  @Get("tool-config/:assistantId")
  @ApiOperation({
    summary: "Get all tool configurations for an assistant",
    description: "Retrieve all saved tools for an assistant",
  })
  @ApiParam({
    name: "assistantId",
    description: "UUID of the assistant",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Configurations retrieved successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "array",
          description: "Array of tool configurations",
        },
      },
    },
  })
  async getToolConfig(@Param("assistantId") assistantId: string): Promise<any> {
    try {
      const tools = await this.toolConfigRepository.find({
        where: { assistantId: assistantId },
      });

      console.log("=============================================");
      console.log("✅ Tool configurations loaded from database");
      console.log("🆔 Assistant ID:", assistantId);
      console.log("📊 Total tools:", tools.length);
      console.log("📋 Tools:", tools.map((t) => t.toolName).join(", "));
      console.log("=============================================");

      return {
        success: true,
        data: tools,
      };
    } catch (error) {
      console.error("❌ Error loading tool config from DB:", error);
      throw new NotFoundException(
        `Failed to load configuration for assistant: ${assistantId}`
      );
    }
  }

  @Post("tool-configs/bulk")
  @ApiOperation({
    summary: "Get tool configurations for multiple assistants (Bulk)",
    description: "Retrieve all saved tools for multiple assistants in a single request",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        assistantIds: {
          type: "array",
          items: { type: "string" },
          example: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"],
          description: "Array of assistant UUIDs"
        },
      },
      required: ["assistantIds"]
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Bulk configurations retrieved successfully",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        data: {
          type: "object",
          description: "Tool configurations grouped by assistant ID",
          additionalProperties: {
            type: "array",
            description: "Array of tool configurations for each assistant"
          }
        },
        totalTools: { type: "number", example: 5 },
      },
    },
  })
  async getBulkToolConfigs(@Body() body: { assistantIds: string[] }): Promise<any> {
    try {
      const { assistantIds } = body;

      if (!assistantIds || !Array.isArray(assistantIds) || assistantIds.length === 0) {
        throw new BadRequestException("assistantIds array is required and cannot be empty");
      }

      console.log("=============================================");
      console.log("🔄 Bulk loading tool configurations");
      console.log("📋 Assistant IDs:", assistantIds);
      console.log("=============================================");

      // Use TypeORM's In operator to fetch all tools for the given assistant IDs in one query
      const tools = await this.toolConfigRepository.find({
        where: { assistantId: In(assistantIds) },
      });

      // Group tools by assistant ID
      const groupedTools: Record<string, any[]> = {};
      assistantIds.forEach(id => {
        groupedTools[id] = [];
      });

      tools.forEach(tool => {
        if (groupedTools[tool.assistantId]) {
          groupedTools[tool.assistantId].push(tool);
        }
      });

      const totalTools = tools.length;

      console.log("✅ Bulk tool configurations loaded");
      console.log("📊 Total tools found:", totalTools);
      console.log("🗂️  Tools per assistant:");
      Object.entries(groupedTools).forEach(([assistantId, toolList]) => {
        console.log(`   - ${assistantId}: ${toolList.length} tool(s)`);
      });
      console.log("=============================================");

      return {
        success: true,
        data: groupedTools,
        totalTools: totalTools,
      };
    } catch (error) {
      console.error("❌ Error loading bulk tool configs from DB:", error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException("Failed to load bulk configurations");
    }
  }

  @Delete("tool-config/:assistantId/:toolName")
  @ApiOperation({
    summary: "Delete a specific tool from an assistant",
    description: "Remove one tool while keeping others",
  })
  @ApiParam({ name: "assistantId", description: "UUID of the assistant" })
  @ApiParam({ name: "toolName", description: "Name of the tool to delete" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Tool deleted successfully",
  })
  async deleteToolConfig(
    @Param("assistantId") assistantId: string,
    @Param("toolName") toolName: string
  ): Promise<any> {
    try {
      const deleteResult = await this.toolConfigRepository.delete({
        assistantId: assistantId,
        toolName: toolName,
      });

      if (deleteResult.affected === 0) {
        throw new NotFoundException(`Tool '${toolName}' not found`);
      }

      const remainingTools = await this.toolConfigRepository.count({
        where: { assistantId },
      });

      console.log("=============================================");
      console.log("🗑️ Tool deleted from database");
      console.log("🆔 Assistant ID:", assistantId);
      console.log("📋 Deleted Tool:", toolName);
      console.log("📊 Remaining tools:", remainingTools);
      console.log("=============================================");

      return {
        success: true,
        message: `Tool '${toolName}' deleted successfully`,
        remainingTools: remainingTools,
      };
    } catch (error) {
      console.error("❌ Error deleting tool from DB:", error);
      throw error;
    }
  }

  @Post("agent-webhook")
  @ApiOperation({
    summary: "Forward collected tool data to user-configured webhook",
    description: "Endpoint called by AI agent to forward collected data to external hooks",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        assistantId: { type: "string" },
        toolName: { type: "string" },
        collectedData: { type: "object" },
      },
    },
  })
  async forwardWebhook(@Body() payload: any): Promise<any> {
    const { assistantId, toolName, collectedData } = payload;

    if (!assistantId || !toolName) {
      throw new BadRequestException("assistantId and toolName are required");
    }

    let tool: any = null;
    try {
      // 🆕 Load tool from DB
      tool = await this.toolConfigRepository.findOne({
        where: {
          assistantId: assistantId,
          toolName: toolName,
        },
      });

      if (!tool || !tool.webhookUrl) {
        console.warn(
          `⚠️ No webhook configured for tool ${toolName} of assistant ${assistantId}`,
        );
        return { success: false, message: "No webhook configured" };
      }

      console.log(
        `📡 Sending data for '${toolName}' to external hook: ${tool.webhookUrl}`,
      );

      const headers = tool.httpHeaders || {};

      // Forward the request to the external webhook
      const response = await axios.post(tool.webhookUrl, collectedData, {
        headers,
      });

      console.log(`✅ External hook responded with status: ${response.status}`);

      return {
        success: true,
        message: "Data forwarded successfully",
        externalStatus: response.status,
      };
    } catch (error: any) {
      const statusCode = error.response?.status || "Unknown";
      const errorData = error.response?.data ? JSON.stringify(error.response.data) : "No data";

      console.error(
        `❌ Webhook forwarding failed for tool '${toolName}'. Target: ${tool?.webhookUrl || "Unknown"}. Status: ${statusCode}. Error: ${error.message}`,
      );

      return {
        success: false,
        message: `External webhook (${tool?.webhookUrl}) returned status ${statusCode}: ${error.message}`,
        details: errorData
      };
    }
  }
}
