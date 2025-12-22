import { ApiProperty } from "@nestjs/swagger";
import { RealtimeProvider } from "../entities/realtime-provider.entity";

export class RealtimeProviderResponseDto {
  @ApiProperty({
    description: "Unique identifier of the realtime provider",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Name of the realtime provider",
    example: "OpenAI Realtime",
  })
  name: string;

  @ApiProperty({
    description: "Whether the realtime provider is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  updatedAt: Date;

  constructor(provider: RealtimeProvider) {
    this.id = provider.id;
    this.name = provider.name;
    this.isActive = provider.isActive;
    this.createdAt = provider.createdAt;
    this.updatedAt = provider.updatedAt;
  }
}
