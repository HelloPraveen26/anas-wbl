import { ApiProperty } from "@nestjs/swagger";

export class DispatchRuleResponseDto {
  @ApiProperty({
    description: "SIP Dispatch Rule ID",
    example: "SDR_uRzWUrE8torL"
  })
  sipDispatchRuleId: string;

  @ApiProperty({
    description: "Dispatch rule name",
    example: "inbound-917943446691-from-sample-app"
  })
  name: string;

  @ApiProperty({
    description: "Assistant ID",
    example: "2833c12e-8bcc-4c50-b6ae-c02bc7ea177c"
  })
  assistantId: string;

  @ApiProperty({
    description: "Assistant name (agent name)",
    example: "hexite-inbound-caller"
  })
  assistantName: string;

  @ApiProperty({
    description: "Phone number",
    example: "+917943446691"
  })
  phoneNumber: string;

  constructor(
    sipDispatchRuleId: string,
    name: string,
    assistantId: string,
    assistantName: string,
    phoneNumber: string,
  ) {
    this.sipDispatchRuleId = sipDispatchRuleId;
    this.name = name;
    this.assistantId = assistantId;
    this.assistantName = assistantName;
    this.phoneNumber = phoneNumber;
  }
}
