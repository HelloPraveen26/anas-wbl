import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  DashboardMetricsQueryDto,
  DashboardMetricsResponseDto,
} from './dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(ThrottlerGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description:
      'Retrieve aggregated metrics from call logs including total calls, average talk time, and total talk time. Supports filtering by date range.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Metrics retrieved successfully',
    type: DashboardMetricsResponseDto,
    example: {
      totalCalls: 150,
      averageTalkTime: 125.5,
      totalTalkTime: 18825,
      averageTalkTimeFormatted: '00:02:05',
      totalTalkTimeFormatted: '05:13:45',
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - invalid query parameters',
  })
  async getMetrics(
    @Query() query: DashboardMetricsQueryDto,
    @Request() req,
  ): Promise<DashboardMetricsResponseDto> {
    return this.dashboardService.getMetrics(req.user.id, query);
  }
}
