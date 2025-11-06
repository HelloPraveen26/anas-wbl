import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { TranscriberModel } from "./transcriber-model.entity";
import { SttConfig } from "./stt-config.entity";

@Entity("transcriber_providers")
export class TranscriberProvider {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @OneToMany(() => TranscriberModel, (model) => model.transcriberProvider)
  transcriberModels: TranscriberModel[];

  @OneToMany(() => SttConfig, (config) => config.transcriberProvider)
  sttConfigs: SttConfig[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
