import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { SynthesizerProvider } from "./synthesizer-provider.entity";

export enum ConfigFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
}

@Entity("tts_configs")
export class TtsConfig {
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

  @Column({ name: "synthesizer_provider_id" })
  synthesizerProviderId: string;

  @ManyToOne(() => SynthesizerProvider, (provider) => provider.ttsConfigs)
  @JoinColumn({ name: "synthesizer_provider_id" })
  synthesizerProvider: SynthesizerProvider;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
