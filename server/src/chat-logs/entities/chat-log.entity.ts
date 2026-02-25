import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { CallLog } from "../../call-logs/entities/call-log.entity";

@Entity("chat_logs")
export class ChatLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "call_log_id", type: "uuid", nullable: true })
  callLogId: string;

  @OneToOne(() => CallLog, (callLog) => callLog.chatLog)
  @JoinColumn({ name: "call_log_id" })
  callLog: CallLog;

  @Column({ name: "room_name", type: "varchar", nullable: true })
  roomName: string;

  @Column({ type: "jsonb" })
  history: Array<{
    role: string;
    content: string;
    interrupted: boolean;
  }>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
