import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("registered_numbers")
@Index(["userId"])
export class RegisteredNumber {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "provider_name", length: 100 })
  providerName: string;

  @Column({ name: "friendly_name", length: 255 })
  friendlyName: string;

  @Column({ name: "phone_no", length: 20 })
  phoneNo: string;

  @Column({ name: "livekit_outbound_trunk_id", length: 255 })
  livekitOutboundTrunkId: string;

  @Column({ name: "livekit_inbound_trunk_id", length: 255, nullable: true })
  livekitInboundTrunkId: string | null;

  @Column({ length: 255, nullable: true })
  username: string | null;

  @Column({ default: true })
  active: boolean;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.registeredNumbers)
  @JoinColumn({ name: "user_id" })
  user: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
