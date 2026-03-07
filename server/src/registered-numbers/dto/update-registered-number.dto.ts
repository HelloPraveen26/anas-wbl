import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
} from "class-validator";

export class UpdateRegisteredNumberDto {
  @ApiPropertyOptional({
    description: "Provider name (e.g., Twilio)",
    example: "twilio",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  providerName?: string;

  @ApiPropertyOptional({
    description: "Friendly name for the number",
    example: "Suguna",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  friendlyName?: string;

  @ApiPropertyOptional({
    description: "Phone number in E.164 format",
    example: "+19282185402",
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: "Phone number must be in E.164 format (e.g., +19282185402)",
  })
  phoneNo?: string;

  @ApiPropertyOptional({
    description: "LiveKit outbound trunk ID",
    example: "ST_xn9xEW6gFR3R",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  livekitOutboundTrunkId?: string;

  @ApiPropertyOptional({
    description: "LiveKit inbound trunk ID",
    example: "ST_yp8yFX7hGS4S",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  livekitInboundTrunkId?: string;

  @ApiPropertyOptional({
    description: "Whether the number is active",
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
