import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDefaultAssistantDto {
  @ApiProperty({
    description: 'Name of the assistant',
    example: 'My Custom Assistant',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
