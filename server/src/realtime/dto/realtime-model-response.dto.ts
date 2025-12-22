import { ApiProperty } from "@nestjs/swagger";
import { RealtimeModel } from "../entities/realtime-model.entity";

export class RealtimeModelResponseDto {
  @ApiProperty({
    description: "Unique identifier of the realtime model",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Name of the realtime model",
    example: "gpt-4o-realtime-preview",
  })
  name: string;

  @ApiProperty({
    description: "Whether the realtime model is active",
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: "Realtime provider details",
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
    },
  })
  realtimeProvider?: {
    id: string;
    name: string;
  };

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

  constructor(model: RealtimeModel) {
    this.id = model.id;
    this.name = model.name;
    this.isActive = model.isActive;
    this.createdAt = model.createdAt;
    this.updatedAt = model.updatedAt;

    if (model.realtimeProvider) {
      this.realtimeProvider = {
        id: model.realtimeProvider.id,
        name: model.realtimeProvider.name,
      };
    }
  }
}
