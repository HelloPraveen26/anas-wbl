import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CallLog } from '../call-logs/entities/call-log.entity';
import { DashboardMetricsQueryDto, DashboardMetricsResponseDto } from './dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CallLog)
    private callLogRepo: Repository<CallLog>,
  ) {}

  async getMetrics(
    userId: string,
    query: DashboardMetricsQueryDto,
  ): Promise<DashboardMetricsResponseDto> {
    const queryBuilder = this.callLogRepo
      .createQueryBuilder('callLog')
      .where('callLog.userId = :userId', { userId });

    // Apply date filters if provided
    if (query.startDate) {
      queryBuilder.andWhere('callLog.createdAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('callLog.createdAt <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    // Get aggregated metrics
    const result = await queryBuilder
      .select('COUNT(callLog.id)', 'totalCalls')
      .addSelect('COALESCE(AVG(callLog.duration), 0)', 'averageTalkTime')
      .addSelect('COALESCE(SUM(callLog.duration), 0)', 'totalTalkTime')
      .getRawOne();

    const totalCalls = parseInt(result.totalCalls) || 0;
    const averageTalkTime = parseFloat(result.averageTalkTime) || 0;
    const totalTalkTime = parseFloat(result.totalTalkTime) || 0;

    return new DashboardMetricsResponseDto(
      totalCalls,
      averageTalkTime,
      totalTalkTime,
    );
  }
}
