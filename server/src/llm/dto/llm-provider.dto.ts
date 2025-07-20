import { IsString, IsBoolean, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLlmProviderDto {
  @ApiProperty({
    description: 'Name of the LLM provider',
    example: 'OpenAI',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({
    description: 'Whether the provider is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLlmProviderDto {
  @ApiPropertyOptional({
    description: 'Name of the LLM provider',
    example: 'OpenAI',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Whether the provider is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class LlmProviderResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the provider',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the LLM provider',
    example: 'OpenAI',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the provider is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Number of models associated with this provider',
    example: 5,
  })
  modelCount?: number;

  @ApiProperty({
    description: 'When the provider was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the provider was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
