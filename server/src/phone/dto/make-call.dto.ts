import { ApiProperty } from "@nestjs/swagger";
import {
  IsPhoneNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class MakeCallDto {
  @ApiProperty({
    description: "The phone number to call, in E.164 format",
    example: "+1234567890",
  })
  @IsNotEmpty()
  @IsPhoneNumber(null, { message: "phone_number must be a valid phone number" })
  phoneNumber: string;

  @ApiProperty({
    description:
      "System prompt for the AI agent (will be mapped to instructions)",
    example:
      "You are an AI Hotel Booking Assistant. Speak with a warm tone and be helpful.",
    required: false,
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiProperty({
    description:
      "First message from the client (will override first_message if provided)",
    example: "Hello, how can I help you today?",
    required: false,
  })
  @IsOptional()
  @IsString()
  firstMessage?: string;

  @ApiProperty({
    description: "Selected assistant ID for tracking purposes",
    example: "5c8a4399-4fbb-4c82-a351-537dbe6fc328",
    required: false,
  })
  @IsOptional()
  @IsString()
  selectedAssistant?: string;
}
