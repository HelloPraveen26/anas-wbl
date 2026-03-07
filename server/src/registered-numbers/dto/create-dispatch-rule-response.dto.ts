import { ApiProperty } from "@nestjs/swagger";

export class CreateDispatchRuleResponseDto {
  @ApiProperty({
    description: "Success message",
    example: "Created dispatch rule successfully",
  })
  message: string;

  @ApiProperty({
    description: "SIP Dispatch Rule ID",
    example: "SDR_uRzWUrE8torL",
  })
  sipDispatchRuleId: string;

  constructor(sipDispatchRuleId: string) {
    this.message = "Created dispatch rule successfully";
    this.sipDispatchRuleId = sipDispatchRuleId;
  }
}
