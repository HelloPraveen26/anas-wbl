import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssistantDto {
  @ApiProperty({
    description: 'Name of the assistant',
    example: 'Customer Service Assistant',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'First message the assistant will send',
    example: 'Hello! How can I help you today?'
  })
  @IsString()
  @IsNotEmpty()
  firstMessage: string;

  @ApiProperty({
    description: 'System prompt that defines assistant behavior',
    example: 'You are a helpful customer service assistant...'
  })
  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @ApiProperty({
    description: 'UUID of the LLM model to use',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  llmModelId: string;

  @ApiProperty({
    description: 'UUID of the transcriber model to use',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsUUID()
  @IsNotEmpty()
  transcriberModelId: string;

  @ApiProperty({
    description: 'UUID of the synthesizer voice to use',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  @IsUUID()
  @IsNotEmpty()
  synthesizerVoiceId: string;

  @ApiPropertyOptional({
    description: 'Whether the assistant is active',
    default: true
  })
  @IsOptional()
  isActive?: boolean;
}
