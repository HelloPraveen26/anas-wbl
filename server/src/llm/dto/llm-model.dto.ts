import { IsString, IsBoolean, IsOptional, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLlmModelDto {
  @ApiProperty({
    description: 'Name of the LLM model',
    example: 'gpt-4',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({
    description: 'UUID of the LLM provider this model belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  llmProviderId: string;

  @ApiPropertyOptional({
    description: 'Whether the model is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLlmModelDto {
  @ApiPropertyOptional({
    description: 'Name of the LLM model',
    example: 'gpt-4-turbo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    description: 'UUID of the LLM provider this model belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  llmProviderId?: string;

  @ApiPropertyOptional({
    description: 'Whether the model is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class LlmModelResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the model',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the LLM model',
    example: 'gpt-4',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the model is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Provider information',
    type: 'object',
  })
  llmProvider: {
    id: string;
    name: string;
    isActive: boolean;
  };

  @ApiProperty({
    description: 'When the model was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the model was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class LlmModelWithoutProviderDto {
  @ApiProperty({
    description: 'Unique identifier for the model',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the LLM model',
    example: 'gpt-4',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the model is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'When the model was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the model was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
