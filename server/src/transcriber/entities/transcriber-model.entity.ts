import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("transcriber_models")
export class TranscriberModel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ManyToOne("TranscriberProvider", "transcriberModels")
  @JoinColumn({ name: "transcriber_provider_id" })
  transcriberProvider: any;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
