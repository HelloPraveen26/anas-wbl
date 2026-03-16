import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
} from "class-validator";

export class CreateRegisteredNumberDto {
  @ApiProperty({
    description: "Provider name (e.g., Twilio)",
    example: "twilio",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  providerName: string;

  @ApiProperty({
    description: "Friendly name for the number",
    example: "Balaji k",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  friendlyName: string;

  @ApiProperty({
    description: "Phone number in E.164 format",
    example: "+19282185402",
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: "Phone number must be in E.164 format (e.g., +19282185402)",
  })
  phoneNo: string;

  @ApiProperty({
    description: "LiveKit outbound trunk ID",
    example: "ST_xn9xEW6gFR3R",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Length(1, 255)
  livekitOutboundTrunkId: string;

  @ApiPropertyOptional({
    description: "LiveKit inbound trunk ID",
    example: "ST_7Y8zAB3cDT4U",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Length(1, 255)
  livekitInboundTrunkId?: string;

  @ApiPropertyOptional({
    description: "Username for authentication",
    example: "auth_username_123",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  username?: string;

  @ApiPropertyOptional({
    description: "Whether the number is active",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}
