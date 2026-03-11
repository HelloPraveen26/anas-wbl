import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsObject,
} from "class-validator";
import { Transform } from "class-transformer";

export class MakeCallDto {
  @ApiProperty({
    description: "The phone number to call, in E.164 format",
    example: "+1234567890",
  })
  @Transform(({ value }) =>
    value && !value.startsWith("+") ? `+${value}` : value,
  )
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: "phone_number must be a valid phone number",
  })
  phoneNumber: string;

  @ApiProperty({
    description: "The phone number from, in E.164 format",
    example: "+19282185402",
    required: false,
    default: "+19282185402",
  })
  @Transform(({ value }) =>
    value && !value.startsWith("+") ? `+${value}` : value,
  )
  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: "fromPhoneNumber must be a valid phone number",
  })
  fromPhoneNumber?: string;

  @ApiProperty({
    description: "Selected assistant ID for tracking purposes",
    example: "5c8a4399-4fbb-4c82-a351-537dbe6fc328",
    required: false,
  })
  @IsOptional()
  @IsString()
  selectedAssistant?: string;

  @ApiProperty({
    description:
      "Optional metadata object for template rendering in system prompts AND tool parameter pre-population. " +
      "If metadata field names match tool parameter names, those values will be automatically collected " +
      "without asking the user during the call.",
    example: {
      name: "John Doe",
      email: "john@example.com",
      company: "Acme Corp",
      phone: "+1234567890",
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class MakeInboundCallDto {
  @ApiProperty({
    description: "The phone number to call, in E.164 format",
    example: "+1234567890",
  })
  @Transform(({ value }) =>
    value && !value.startsWith("+") ? `+${value}` : value,
  )
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: "phone_number must be a valid phone number",
  })
  phoneNumber: string;

  @ApiProperty({
    description: "The phone number from, in E.164 format",
    example: "+19282185402",
    required: false,
    default: "+19282185402",
  })
  @Transform(({ value }) =>
    value && !value.startsWith("+") ? `+${value}` : value,
  )
  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: "fromPhoneNumber must be a valid phone number",
  })
  fromPhoneNumber?: string;

  @ApiProperty({
    description: "Selected assistant ID (required for inbound calls)",
    example: "5c8a4399-4fbb-4c82-a351-537dbe6fc328",
  })
  @IsNotEmpty()
  @IsString()
  selectedAssistant: string;
}
