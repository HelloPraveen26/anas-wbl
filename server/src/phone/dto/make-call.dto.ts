import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsNotEmpty } from 'class-validator';

export class MakeCallDto {
  @ApiProperty({
    description: 'The phone number to call, in E.164 format',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsPhoneNumber(null, { message: 'phone_number must be a valid phone number' })
  phone_number: string;
}
