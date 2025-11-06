import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { SynthesizerProvider } from "./synthesizer-provider.entity";
import { SynthesizerVoice } from "./synthesizer-voice.entity";

@Entity("synthesizer_models")
export class SynthesizerModel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ManyToOne(
    () => SynthesizerProvider,
    (provider) => provider.synthesizerModels,
  )
  @JoinColumn({ name: "synthesizer_provider_id" })
  synthesizerProvider: SynthesizerProvider;

  @OneToMany(() => SynthesizerVoice, (voice) => voice.synthesizerModel)
  synthesizerVoices: SynthesizerVoice[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
