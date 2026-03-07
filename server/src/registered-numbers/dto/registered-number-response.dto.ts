import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { RegisteredNumber } from "../entities/registered-number.entity";

@Exclude()
export class RegisteredNumberResponseDto {
  @ApiProperty({ description: "Registered number ID" })
  @Expose()
  id: string;

  @ApiProperty({ description: "Provider name (e.g., Twilio)" })
  @Expose()
  providerName: string;

  @ApiProperty({ description: "Friendly name for the number" })
  @Expose()
  friendlyName: string;

  @ApiProperty({ description: "Phone number" })
  @Expose()
  phoneNo: string;

  @ApiProperty({ description: "LiveKit outbound trunk ID" })
  @Expose()
  livekitOutboundTrunkId: string;

  @ApiPropertyOptional({ description: "LiveKit inbound trunk ID" })
  @Expose()
  livekitInboundTrunkId?: string;

  @ApiProperty({ description: "Whether the number is active" })
  @Expose()
  active: boolean;

  @ApiProperty({ description: "Creation timestamp" })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp" })
  @Expose()
  updatedAt: Date;

  constructor(registeredNumber: RegisteredNumber) {
    Object.assign(this, registeredNumber);
  }
}
