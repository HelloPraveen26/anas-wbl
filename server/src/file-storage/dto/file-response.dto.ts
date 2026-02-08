import { ApiProperty } from "@nestjs/swagger";
import { File } from "../entities/file.entity";

export class FileResponseDto {
  @ApiProperty({
    description: "Unique identifier of the file",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Original filename",
    example: "document.pdf",
  })
  originalName: string;

  @ApiProperty({
    description: "MIME type of the file",
    example: "application/pdf",
  })
  mimeType: string;

  @ApiProperty({
    description: "File size in bytes",
    example: 102400,
  })
  fileSize: number;

  @ApiProperty({
    description: "Storage type (local or s3)",
    example: "local",
  })
  storageType: string;

  @ApiProperty({
    description: "Assistant ID this file belongs to",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  assistantId: string;

  @ApiProperty({
    description: "File creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "File last update timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  updatedAt: Date;

  constructor(file: File) {
    this.id = file.id;
    this.originalName = file.originalName;
    this.mimeType = file.mimeType;
    this.fileSize = file.fileSize;
    this.storageType = file.storageType;
    this.assistantId = file.assistantId;
    this.createdAt = file.createdAt;
    this.updatedAt = file.updatedAt;
  }
}
