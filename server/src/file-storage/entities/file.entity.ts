import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Assistant } from "../../assistant/entities/assistant.entity";

@Entity("files")
export class File {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "original_name", length: 255 })
  originalName: string;

  @Column({ name: "stored_name", length: 255 })
  storedName: string;

  @Column({ name: "file_path", length: 500 })
  filePath: string;

  @Column({ name: "mime_type", length: 100 })
  mimeType: string;

  @Column({ name: "file_size", type: "integer" })
  fileSize: number;

  @Column({ name: "storage_type", length: 50, default: "local" })
  storageType: string; // 'local' or 's3'

  @Column({ name: "s3_key", length: 500, nullable: true })
  s3Key: string;

  @Column({ name: "s3_bucket", length: 255, nullable: true })
  s3Bucket: string;

  @Column({ name: "assistant_id", type: "uuid" })
  assistantId: string;

  @ManyToOne(() => Assistant, (assistant) => assistant.files, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "assistant_id" })
  assistant: Assistant;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
