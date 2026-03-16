import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsObject,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class MessageMetrics {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  started_speaking_at?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  stopped_speaking_at?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  llm_node_ttft?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  tts_node_ttfb?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  e2e_latency?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  transcription_delay?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  end_of_turn_delay?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  on_user_turn_completed_delay?: number;
}

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

  @ApiProperty({ required: false, type: MessageMetrics })
  @ValidateNested()
  @Type(() => MessageMetrics)
  @IsOptional()
  metrics?: MessageMetrics;

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

  // Allow any other properties for future extensibility
  [key: string]: any;
}
