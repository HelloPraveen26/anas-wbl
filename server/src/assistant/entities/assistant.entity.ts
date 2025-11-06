import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

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

  @Column({ name: "llm_model_id", type: "uuid" })
  llmModelId: string;

  @Column({ name: "transcriber_model_id", type: "uuid" })
  transcriberModelId: string;

  @Column({ name: "synthesizer_voice_id", type: "uuid" })
  synthesizerVoiceId: string;

  @Column({ name: "stt_config", type: "json", nullable: true })
  sttConfig: Record<string, any>;

  @Column({ name: "tts_config", type: "json", nullable: true })
  ttsConfig: Record<string, any>;

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

  @ManyToOne("SynthesizerVoice")
  @JoinColumn({ name: "synthesizer_voice_id" })
  synthesizerVoice: any;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
