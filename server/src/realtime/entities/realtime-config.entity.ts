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

export enum ConfigFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
}

@Entity("realtime_configs")
export class RealtimeConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  label: string;

  @Column({ length: 100 })
  key: string;

  @Column({
    type: "enum",
    enum: ConfigFieldType,
  })
  type: ConfigFieldType;

  @Column({ type: "jsonb", nullable: true })
  list: any;

  @Column({ name: "default_value", type: "text", nullable: true })
  defaultValue: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: "realtime_provider_id" })
  realtimeProviderId: string;

  @ManyToOne(() => RealtimeProvider, (provider) => provider.realtimeConfigs)
  @JoinColumn({ name: "realtime_provider_id" })
  realtimeProvider: RealtimeProvider;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
