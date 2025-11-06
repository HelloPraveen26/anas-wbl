import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { SynthesizerModel } from "./synthesizer-model.entity";

@Entity("synthesizer_voices")
export class SynthesizerVoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ManyToOne(() => SynthesizerModel, (model) => model.synthesizerVoices)
  @JoinColumn({ name: "synthesizer_model_id" })
  synthesizerModel: SynthesizerModel;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
