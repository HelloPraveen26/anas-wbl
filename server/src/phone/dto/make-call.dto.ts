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
  phone_number: string;

  @ApiProperty({
    description: "Custom instructions for the AI agent",
    example:
      "You are a sales representative calling to schedule an appointment.",
    required: false,
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({
    description: "Custom first message the agent should say",
    example:
      "Hello, this is Sarah calling from ABC Company. How are you today?",
    required: false,
  })
  @IsOptional()
  @IsString()
  first_message?: string;

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
    example: "assistant_123",
    required: false,
  })
  @IsOptional()
  @IsString()
  selectedAssistant?: string;
}
