import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RealtimeConfig, ConfigFieldType } from "../entities/realtime-config.entity";

export class RealtimeConfigResponseDto {
  @ApiProperty({
    description: "Unique identifier of the realtime config",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Display label of the config field",
    example: "Temperature",
  })
  label: string;

  @ApiProperty({
    description: "Configuration key",
    example: "temperature",
  })
  key: string;

  @ApiProperty({
    description: "Type of the configuration field",
    enum: ConfigFieldType,
    example: ConfigFieldType.NUMBER,
  })
  type: ConfigFieldType;

  @ApiPropertyOptional({
    description: "List of options for select type fields",
    type: "array",
    items: {
      type: "object",
      properties: {
        displayName: { type: "string" },
        value: { type: "string" },
      },
    },
    example: [
      { displayName: "Alloy", value: "alloy" },
      { displayName: "Echo", value: "echo" },
    ],
  })
  list?: any[];

  @ApiPropertyOptional({
    description: "Default value for the configuration",
    example: "0.7",
  })
  defaultValue?: string;

  @ApiProperty({
    description: "Whether the configuration is active",
    example: true,
  })
  active: boolean;

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

  constructor(config: RealtimeConfig) {
    this.id = config.id;
    this.label = config.label;
    this.key = config.key;
    this.type = config.type;
    this.list = config.list;
    this.defaultValue = config.defaultValue;
    this.active = config.active;
    this.createdAt = config.createdAt;
    this.updatedAt = config.updatedAt;

    if (config.realtimeProvider) {
      this.realtimeProvider = {
        id: config.realtimeProvider.id,
        name: config.realtimeProvider.name,
      };
    }
  }
}
