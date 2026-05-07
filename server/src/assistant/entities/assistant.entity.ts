import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { ToolConfig } from "./tool-config.entity";
import { File } from "../../file-storage/entities/file.entity";

@Entity("assistants")
export class Assistant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: "first_message", type: "text" })
  firstMessage: string;

  @Column({ name: "system_prompt", type: "text" })
  systemPrompt: string;

  @Column({ name: "llm_model_id", type: "uuid", nullable: true })
  llmModelId: string;

  @Column({ name: "transcriber_model_id", type: "uuid", nullable: true })
  transcriberModelId: string;

  @Column({ name: "synthesizer_model_id", type: "uuid", nullable: true })
  synthesizerModelId: string;

  @Column({ name: "realtime_model_id", type: "uuid", nullable: true })
  realtimeModelId: string;

  @Column({ name: "stt_config", type: "json", nullable: true, default: {} })
  sttConfig: Record<string, any>;

  @Column({ name: "tts_config", type: "json", nullable: true, default: {} })
  ttsConfig: Record<string, any>;

  @Column({
    name: "realtime_config",
    type: "json",
    nullable: true,
    default: {},
  })
  realtimeConfig: Record<string, any>;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ManyToOne("User", "assistants")
  @JoinColumn({ name: "user_id" })
  user: any;

  // Virtual relationships for easy access to related entities
  @ManyToOne("LlmModel")
  @JoinColumn({ name: "llm_model_id" })
  llmModel: any;

  @ManyToOne("TranscriberModel")
  @JoinColumn({ name: "transcriber_model_id" })
  transcriberModel: any;

  @ManyToOne("SynthesizerModel")
  @JoinColumn({ name: "synthesizer_model_id" })
  synthesizerModel: any;

  @ManyToOne("RealtimeModel")
  @JoinColumn({ name: "realtime_model_id" })
  realtimeModel: any;

  @OneToMany("ToolConfig", (toolConfig: any) => toolConfig.assistant)
  toolConfigs: any[];

  @OneToMany(() => File, (file) => file.assistant)
  files: File[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
