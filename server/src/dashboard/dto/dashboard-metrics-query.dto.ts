import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class DashboardMetricsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering call logs (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering call logs (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
