import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsObject,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";

class HistoryItem {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  content?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  new_agent_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  interrupted?: boolean;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  extra?: Record<string, any>;

  @ApiProperty({
    required: false,
    type: "object",
    description:
      "Dynamic metrics data that may contain various performance measurements",
  })
  @IsObject()
  @IsOptional()
  metrics?: Record<string, any>;

  // Function call properties
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  call_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  arguments?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  // Function call output properties
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  output?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  is_error?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  transcript_confidence?: number;
}

class History {
  @ApiProperty({ type: [HistoryItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryItem)
  items: HistoryItem[];
}

export class CallSummaryDto {
  @ApiProperty({
    description: "Room name identifier for the call session",
    example: "sip-fd6e29e3",
  })
  @IsString()
  room_name: string;

  @ApiProperty({
    description: "Call history containing all messages and interactions",
    type: History,
    example: {
      items: [
        {
          id: "item_6c9b175b7ee3",
          type: "agent_handoff",
          new_agent_id: "assistant",
        },
        {
          id: "GR_7887fee2c470",
          type: "message",
          role: "assistant",
          content: ["Hello How can I help you today"],
          interrupted: false,
          extra: {},
          metrics: {
            started_speaking_at: 1771866892.414398,
            stopped_speaking_at: 1771866894.043726,
          },
        },
        {
          id: "GI_71db268a330e",
          type: "message",
          role: "user",
          content: ["I just want to know a few information."],
          interrupted: false,
          extra: {},
          metrics: {},
        },
      ],
    },
  })
  @ValidateNested()
  @Type(() => History)
  history: History;

  @ApiProperty({
    description: "Timestamp when the call summary was captured",
    example: "2026-02-23T17:15:39.339795+00:00",
  })
  @IsString()
  @IsOptional()
  captured_at?: string;

  @ApiProperty({
    description: "Timestamp when the call started",
    example: "2026-02-23T17:14:34.870660+00:00",
  })
  @IsString()
  start_time: string;

  @ApiProperty({
    description: "Timestamp when the call ended",
    example: "2026-02-23T17:15:39.319380+00:00",
  })
  @IsString()
  end_time: string;

  @ApiProperty({
    description: "Total duration of the call in seconds",
    example: 64.44871997833252,
  })
  @IsNumber()
  call_duration_seconds: number;

  @ApiProperty({
    description: "Optional call log identifier",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsString()
  @IsOptional()
  call_log_id?: string;

  @ApiProperty({
    description: "Type of call - inbound or outbound",
    example: "inbound",
    enum: ["inbound", "outbound"],
    required: false,
  })
  @IsString()
  @IsIn(["inbound", "outbound"])
  @IsOptional()
  type?: "inbound" | "outbound";

  @ApiProperty({
    description: "Whether the participant actually connected to the call",
    example: true,
    required: false,
  })
  @IsOptional()
  participant_connected?: boolean;

  // Allow any other properties for future extensibility
  [key: string]: any;
}
