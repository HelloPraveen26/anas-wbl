import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class MakeCallDto {
  @ApiProperty({
    description: "The phone number to call, in E.164 format",
    example: "+1234567890",
  })
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
}
