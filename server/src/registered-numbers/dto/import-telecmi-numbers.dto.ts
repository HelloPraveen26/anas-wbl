import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsArray,
  ArrayNotEmpty,
} from "class-validator";

export class ImportTelecmiNumbersDto {
  @ApiPropertyOptional({
    description: "Telecmi Account SID (optional)",
    example: "TExxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  accountSid?: string;

  @ApiPropertyOptional({
    description: "Telecmi Auth Token (optional)",
    example: "your_auth_token_here",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  authToken?: string;

  @ApiPropertyOptional({
    description: "SIP trunk address (optional)",
    example: "telecmi-trunk.example.com",
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
    description: "Phone number to import",
    example: "+1234567890",
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
