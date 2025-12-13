import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class CallLogsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 50,
    minimum: 1,
    maximum: 50,
    default: 50
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => Math.min(parseInt(value) || 50, 50))
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Filter by call type',
    example: 'outbound',
    enum: ['inbound', 'outbound']
  })
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter by call status',
    example: 'completed',
    enum: ['completed', 'failed', 'missed', 'in-progress']
  })
  @IsOptional()
  callStatus?: string;
}
