import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose, Transform } from "class-transformer";
import { ChatLog } from "../entities/chat-log.entity";

@Exclude()
export class ChatLogResponseDto {
  @ApiProperty({
    description: "Chat log ID",
    example: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "Call log ID",
    example: "cd08aaba-abd7-4afc-b352-1cb22e74d97d",
  })
  @Expose()
  callLogId: string;

  @ApiPropertyOptional({
    description: "Room name",
    example: "room-12345",
  })
  @Expose()
  roomName?: string;

  @ApiProperty({
    description: "Chat history with messages",
    example: [
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
  })
  @Expose()
  history: Array<{
    role: string;
    content: string;
    interrupted: boolean;
  }>;

  @ApiProperty({
    description: "Record creation timestamp",
    example: "2025-12-13T13:29:41.876Z",
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Record update timestamp",
    example: "2025-12-13T13:30:15.123Z",
  })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: "Assistant phone number (from related call log)",
    example: "+16282824655",
  })
  @Expose()
  @Transform(({ obj }) => obj.callLog?.assistantPhone || null)
  assistantPhone?: string;

  @ApiPropertyOptional({
    description: "Customer phone number (from related call log)",
    example: "+919499001032",
  })
  @Expose()
  @Transform(({ obj }) => obj.callLog?.customerPhone || null)
  customerPhone?: string;

  @ApiPropertyOptional({
    description: "Assistant name (from related call log)",
    example: "Customer Support Assistant",
  })
  @Expose()
  @Transform(({ obj }) => obj.callLog?.assistant?.name || null)
  assistantName?: string;

  constructor(chatLog: ChatLog) {
    Object.assign(this, chatLog);
  }
}
