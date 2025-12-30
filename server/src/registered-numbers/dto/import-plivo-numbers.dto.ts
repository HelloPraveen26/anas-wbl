import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, Length } from "class-validator";

export class ImportPlivoNumbersDto {
  @ApiProperty({
    description: "Plivo Auth ID",
    example: "",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  accountSid: string;

  @ApiProperty({
    description: "Plivo Auth Token",
    example: "",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  authToken: string;

  @ApiPropertyOptional({
    description: "SIP trunk address (optional)",
    example: "plivo-trunk.example.com",
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
}
