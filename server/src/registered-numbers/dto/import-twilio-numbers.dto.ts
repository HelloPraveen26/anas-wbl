import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsBoolean,
} from "class-validator";

export class ImportTwilioNumbersDto {
  @ApiProperty({
    description: "Phone number to import",
    example: "+1234567890",
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: "SIP trunk address (optional)",
    example: "zenvoice-test-trunk.pstn.twilio.com",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  address?: string;

  @ApiProperty({
    description: "SIP authentication username",
    example: "sample",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  authUsername: string;

  @ApiProperty({
    description: "SIP authentication password",
    example: "Sample@123456",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  authPassword: string;

  @ApiProperty({
    description: "Enable inbound calls for this number",
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  inboundEnabled: boolean;

  @ApiProperty({
    description: "Enable outbound calls for this number",
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  outboundEnabled: boolean;
}
