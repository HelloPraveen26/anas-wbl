import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { RealtimeProvider } from "./realtime-provider.entity";

@Entity("realtime_models")
export class RealtimeModel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "realtime_provider_id" })
  realtimeProviderId: string;

  @ManyToOne(
    () => RealtimeProvider,
    (provider) => provider.realtimeModels,
  )
  @JoinColumn({ name: "realtime_provider_id" })
  realtimeProvider: RealtimeProvider;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
