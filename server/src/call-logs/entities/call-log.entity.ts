import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Assistant } from '../../assistant/entities/assistant.entity';

@Entity('call_logs')
export class CallLog {
  @PrimaryColumn()
  id: string; // external call ID (Twilio CallSid / Vapi callId)

  @Column({ name: 'assistant_id' })
  assistantId: string;

  @ManyToOne(() => Assistant)
  @JoinColumn({ name: 'assistant_id' })
  assistant: Assistant;

  @Column()
  assistantPhone: string;

  @Column()
  customerPhone: string;

  @Column()
  type: string; // inbound | outbound

  @Column()
  callStatus: string; // completed | failed | missed

  @Column({ nullable: true })
  successEvaluation: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost: number;
}
