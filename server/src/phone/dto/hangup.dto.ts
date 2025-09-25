import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class HangupDto {
  @ApiProperty({
    description: 'The room name for the call to hang up',
    example: 'sip-a1b2c3d4',
  })
  @IsString()
  @IsNotEmpty()
  room_name: string;
}
