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

@Entity("synthesizer_models")
export class SynthesizerModel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ManyToOne("SynthesizerProvider", "synthesizerModels")
  @JoinColumn({ name: "synthesizer_provider_id" })
  synthesizerProvider: any;

  @OneToMany("SynthesizerVoice", "synthesizerModel")
  synthesizerVoices: any[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
