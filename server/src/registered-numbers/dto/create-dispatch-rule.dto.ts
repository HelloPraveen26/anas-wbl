import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateDispatchRuleDto {
  @ApiProperty({
    description: "Assistant ID",
    example: "2833c12e-8bcc-4c50-b6ae-c02bc7ea177c",
  })
  @IsString()
  @IsNotEmpty()
  assistantId: string;

  @ApiProperty({
    description: "Phone number",
    example: "+917943446691",
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: "Trunk ID (LiveKit SIP Trunk ID)",
    example: "ST_xn9xEW6gFR3R",
  })
  @IsString()
  @IsNotEmpty()
  trunkId: string;
}
