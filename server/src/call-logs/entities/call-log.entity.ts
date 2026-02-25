import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Assistant } from "../../assistant/entities/assistant.entity";
import { User } from "../../users/entities/user.entity";
import { ChatLog } from "../../chat-logs/entities/chat-log.entity";

@Entity("call_logs")
export class CallLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "session_id", nullable: true, unique: true })
  @Index({ unique: true, where: "session_id IS NOT NULL" })
  sessionId: string;

  @Column({ name: "assistant_id", type: "uuid" })
  assistantId: string;

  @ManyToOne(() => Assistant)
  @JoinColumn({ name: "assistant_id" })
  assistant: Assistant;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "assistant_phone" })
  assistantPhone: string;

  @Column({ name: "customer_phone" })
  customerPhone: string;

  @Column()
  type: string; // inbound | outbound

  @Column({ name: "call_status", nullable: true })
  callStatus: string; // completed | failed | missed

  @Column({ name: "success_evaluation", nullable: true })
  successEvaluation: string;

  @Column({ name: "start_time", type: "timestamp", nullable: true })
  startTime: Date;

  @Column({ type: "int", nullable: true, default: 0 })
  duration: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 8,
    nullable: true,
    default: 0,
  })
  cost: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToOne(() => ChatLog, (chatLog) => chatLog.callLog)
  chatLog: ChatLog;
}
