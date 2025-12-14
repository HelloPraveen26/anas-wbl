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
import { CallLogsService } from "./call-logs.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CallLogsQueryDto,
  PaginatedCallLogsResponseDto,
  CallLogResponseDto,
} from "./dto";

@ApiTags("call-logs")
@Controller("call-logs")
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class CallLogsController {
  constructor(private readonly callLogsService: CallLogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get user call logs with pagination",
    description:
      "Retrieve call logs for the authenticated user with pagination support. Maximum 50 records per page.",
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
    description: "Number of records per page (max 50)",
    example: 50,
  })
  @ApiQuery({
    name: "type",
    required: false,
    enum: ["inbound", "outbound"],
    description: "Filter by call type",
  })
  @ApiQuery({
    name: "callStatus",
    required: false,
    enum: ["completed", "failed", "missed", "in-progress"],
    description: "Filter by call status",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Call logs retrieved successfully",
    type: PaginatedCallLogsResponseDto,
    example: {
      data: [
        {
          id: "cd08aaba-abd7-4afc-b352-1cb22e74d97d",
          sessionId: "sip-115b47b4",
          assistantId: "ef088031-ffdc-4638-9f0c-bb7d5635b6ba",
          assistantName: "Customer Support Assistant",
          assistantPhone: "+16282824655",
          customerPhone: "+919499001032",
          type: "outbound",
          callStatus: "completed",
          successEvaluation: "successful",
          startTime: "2025-12-13T13:29:41.876Z",
          duration: "02:45",
          cost: 0.0030724,
          createdAt: "2025-12-13T13:29:41.876Z",
        },
      ],
      pagination: {
        currentPage: 1,
        itemsPerPage: 50,
        totalItems: 125,
        totalPages: 3,
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
  async getCallLogs(
    @Query() query: CallLogsQueryDto,
    @Request() req,
  ): Promise<PaginatedCallLogsResponseDto> {
    const { data, total } = await this.callLogsService.findByUserWithPagination(
      req.user.id,
      query,
    );

    const callLogsDto = data.map((callLog) => new CallLogResponseDto(callLog));

    return new PaginatedCallLogsResponseDto(
      callLogsDto,
      query.page || 1,
      query.limit || 50,
      total,
    );
  }
}
