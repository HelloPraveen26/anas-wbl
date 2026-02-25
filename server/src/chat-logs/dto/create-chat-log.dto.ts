import { IsString, IsUUID, IsArray, ValidateNested, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsString()
  role: string;

  @IsString()
  content: string;

  @IsBoolean()
  interrupted: boolean;
}

export class CreateChatLogDto {
  @IsUUID()
  callLogId: string;

  @IsString()
  @IsOptional()
  roomName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history: ChatMessageDto[];
}
