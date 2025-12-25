import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity("realtime_providers")
export class RealtimeProvider {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @OneToMany("RealtimeModel", "realtimeProvider")
  realtimeModels: any[];

  @OneToMany("RealtimeConfig", "realtimeProvider")
  realtimeConfigs: any[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
