import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { LlmProvider } from "./llm-provider.entity";

@Entity("llm_models")
export class LlmModel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ManyToOne(() => LlmProvider, (llmProvider) => llmProvider.llmModels)
  @JoinColumn({ name: "llm_provider_id" })
  llmProvider: LlmProvider;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
