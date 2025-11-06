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

@Entity("transcriber_models")
export class TranscriberModel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @ManyToOne(
    () => TranscriberProvider,
    (provider) => provider.transcriberModels,
  )
  @JoinColumn({ name: "transcriber_provider_id" })
  transcriberProvider: TranscriberProvider;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
