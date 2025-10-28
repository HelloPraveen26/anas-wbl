import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class ImportTwilioNumbersDto {
  @ApiProperty({
    description: 'Twilio Account SID',
    example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    maxLength: 34,
  })
  @IsString()
  @IsNotEmpty()
  @Length(34, 34)
  accountSid: string;

  @ApiProperty({
    description: 'Twilio Auth Token',
    example: 'your_auth_token_here',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  authToken: string;

  @ApiPropertyOptional({
    description: 'SIP trunk address (optional)',
    example: 'zenvoice-test-trunk.pstn.twilio.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  address?: string;
}
