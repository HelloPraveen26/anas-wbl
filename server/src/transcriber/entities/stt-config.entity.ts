import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { TranscriberProvider } from "./transcriber-provider.entity";

export enum ConfigFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
}

@Entity("stt_configs")
export class SttConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  label: string;

  @Column({ length: 100 })
  key: string;

  @Column({
    type: "enum",
    enum: ConfigFieldType,
  })
  type: ConfigFieldType;

  @Column({ type: "jsonb", nullable: true })
  list: any;

  @Column({ name: "default_value", type: "text", nullable: true })
  defaultValue: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: "transcriber_provider_id" })
  transcriberProviderId: string;

  @ManyToOne(() => TranscriberProvider, (provider) => provider.sttConfigs)
  @JoinColumn({ name: "transcriber_provider_id" })
  transcriberProvider: TranscriberProvider;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
