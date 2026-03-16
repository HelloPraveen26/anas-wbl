import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsBoolean,
  Matches,
} from "class-validator";

export class ImportPlivoNumbersDto {
  @ApiProperty({
    description: "Phone number to import",
    example: "+1234567890",
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: "phoneNumber must be a valid phone number in E.164 format",
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: "SIP trunk address (optional)",
    example: "13128041375304087.zt.plivo.com",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Length(1, 255)
  address?: string;

  @ApiProperty({
    description: "SIP authentication username",
    example: "sample",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
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
