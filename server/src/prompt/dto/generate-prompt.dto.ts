import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class GeneratePromptDto {
  @ApiProperty({
    description: 'Task description for which to generate a structured AI prompt',
    example: 'to book a hotel appointment',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Task description must be at least 3 characters long' })
  @MaxLength(500, { message: 'Task description must not exceed 500 characters' })
  taskDescription: string;
}
