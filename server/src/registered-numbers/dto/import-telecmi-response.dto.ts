import { ApiProperty } from "@nestjs/swagger";

export class ImportTelecmiResponseDto {
  @ApiProperty({
    description: "Number of phone numbers successfully imported",
    example: 5,
  })
  importedCount: number;

  @ApiProperty({
    description: "LiveKit outbound trunk ID created for the imported numbers",
    example: "ST_YTGYHbEZ8PWm",
  })
  livekitOutboundTrunkId: string;

  @ApiProperty({
    description: "List of imported phone numbers with their details",
    type: "array",
    items: {
      type: "object",
      properties: {
        phoneNumber: { type: "string", example: "+1234567890" },
        friendlyName: { type: "string", example: "+1234567890" },
        registeredNumberId: { type: "string", example: "uuid-here" },
      },
    },
  })
  importedNumbers: Array<{
    phoneNumber: string;
    friendlyName: string;
    registeredNumberId: string;
  }>;

  @ApiProperty({
    description: "Import operation message",
    example: "Successfully imported 5 phone numbers from Telecmi",
  })
  message: string;
}
