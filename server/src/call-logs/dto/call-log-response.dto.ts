import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose, Transform } from "class-transformer";
import { CallLog } from "../entities/call-log.entity";

@Exclude()
export class CallLogResponseDto {
  @ApiProperty({
    description: "Call log ID (also used as Call ID)",
    example: "cd08aaba-abd7-4afc-b352-1cb22e74d97d",
  })
  @Expose()
  id: string;

  @ApiPropertyOptional({
    description: "Session ID",
    example: "sip-115b47b4",
  })
  @Expose()
  sessionId?: string;

  @ApiProperty({
    description: "Assistant ID",
    example: "ef088031-ffdc-4638-9f0c-bb7d5635b6ba",
  })
  @Expose()
  assistantId: string;

  @ApiProperty({
    description: "User ID",
    example: "e5a2a5e3-81d7-4534-a4f7-66283f5a65cc",
  })
  @Expose()
  userId: string;

  @ApiPropertyOptional({
    description: "Assistant name",
    example: "Customer Support Assistant",
  })
  @Expose()
  @Transform(({ obj }) => obj.assistant?.name || "Unknown Assistant")
  assistantName?: string;

  @ApiProperty({
    description: "Assistant phone number",
    example: "+16282824655",
  })
  @Expose()
  assistantPhone: string;

  @ApiProperty({
    description: "Customer phone number",
    example: "+919499001032",
  })
  @Expose()
  customerPhone: string;

  @ApiProperty({
    description: "Call type",
    example: "outbound",
    enum: ["inbound", "outbound"],
  })
  @Expose()
  type: string;

  @ApiPropertyOptional({
    description: "Call status",
    example: "completed",
    enum: ["completed", "failed", "missed", "in-progress"],
  })
  @Expose()
  callStatus?: string;

  @ApiPropertyOptional({
    description: "Success evaluation of the call",
    example: "successful",
  })
  @Expose()
  successEvaluation?: string;

  @ApiPropertyOptional({
    description: "Call start time",
    example: "2025-12-13T13:29:41.876Z",
  })
  @Expose()
  startTime?: Date;

  @ApiPropertyOptional({
    description: "Call duration in human readable format (MM:SS)",
    example: "02:45",
  })
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.duration) return "00:00";
    const minutes = Math.floor(obj.duration / 60);
    const seconds = obj.duration % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  })
  duration: string;

  @ApiPropertyOptional({
    description: "Call cost in USD",
    example: 0.0030724,
  })
  @Expose()
  cost?: number;

  @ApiProperty({
    description: "Record creation timestamp",
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Record update timestamp",
  })
  @Expose()
  updatedAt: Date;

  constructor(callLog: CallLog) {
    Object.assign(this, callLog);
  }
}
