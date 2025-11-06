import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { SynthesizerModel } from "./synthesizer-model.entity";
import { TtsConfig } from "./tts-config.entity";

@Entity("synthesizer_providers")
export class SynthesizerProvider {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @OneToMany(() => SynthesizerModel, (model) => model.synthesizerProvider)
  synthesizerModels: SynthesizerModel[];

  @OneToMany(() => TtsConfig, (config) => config.synthesizerProvider)
  ttsConfigs: TtsConfig[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
