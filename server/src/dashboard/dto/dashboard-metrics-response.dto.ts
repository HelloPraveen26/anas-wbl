import { ApiProperty } from '@nestjs/swagger';

export class DashboardMetricsResponseDto {
  @ApiProperty({
    description: 'Total number of calls',
    example: 150,
    type: Number,
  })
  totalCalls: number;

  @ApiProperty({
    description: 'Average talk time in seconds',
    example: 125.5,
    type: Number,
  })
  averageTalkTime: number;

  @ApiProperty({
    description: 'Total talk time in seconds',
    example: 18825,
    type: Number,
  })
  totalTalkTime: number;

  @ApiProperty({
    description: 'Average talk time formatted as HH:MM:SS',
    example: '00:02:05',
    type: String,
  })
  averageTalkTimeFormatted: string;

  @ApiProperty({
    description: 'Total talk time formatted as HH:MM:SS',
    example: '05:13:45',
    type: String,
  })
  totalTalkTimeFormatted: string;

  constructor(totalCalls: number, averageTalkTime: number, totalTalkTime: number) {
    this.totalCalls = totalCalls;
    this.averageTalkTime = Math.round(averageTalkTime * 100) / 100; // Round to 2 decimal places
    this.totalTalkTime = totalTalkTime;
    this.averageTalkTimeFormatted = this.formatDuration(averageTalkTime);
    this.totalTalkTimeFormatted = this.formatDuration(totalTalkTime);
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
