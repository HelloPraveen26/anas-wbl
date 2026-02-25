import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";
import { ChatLogsService } from "./chat-logs.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ChatLogsQueryDto,
  PaginatedChatLogsResponseDto,
  ChatLogResponseDto,
} from "./dto";

@ApiTags("chat-logs")
@Controller("chat-logs")
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ChatLogsController {
  constructor(private readonly chatLogsService: ChatLogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get user chat logs with pagination",
    description:
      "Retrieve chat logs for the authenticated user with pagination support. Maximum 10 records per page.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (1-based)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of records per page (max 10)",
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Chat logs retrieved successfully",
    type: PaginatedChatLogsResponseDto,
    example: {
      data: [
        {
          id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          callLogId: "cd08aaba-abd7-4afc-b352-1cb22e74d97d",
          roomName: "room-12345",
          history: [
            {
              role: "assistant",
              content: "Hello! How can I help you today?",
              interrupted: false,
            },
            {
              role: "user",
              content: "I need help with my order",
              interrupted: false,
            },
          ],
          createdAt: "2025-12-13T13:29:41.876Z",
          updatedAt: "2025-12-13T13:30:15.123Z",
          assistantPhone: "+16282824655",
          customerPhone: "+919499001032",
          assistantName: "Customer Support Assistant",
        },
      ],
      pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 45,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - invalid token",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Bad request - invalid query parameters",
  })
  async getChatLogs(
    @Query() query: ChatLogsQueryDto,
    @Request() req,
  ): Promise<PaginatedChatLogsResponseDto> {
    const { data, total } = await this.chatLogsService.findByUserWithPagination(
      req.user.id,
      query,
    );

    const chatLogsDto = data.map((chatLog) => new ChatLogResponseDto(chatLog));

    return new PaginatedChatLogsResponseDto(
      chatLogsDto,
      query.page || 1,
      query.limit || 10,
      total,
    );
  }
}
