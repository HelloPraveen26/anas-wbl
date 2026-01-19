import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "mihpayid", nullable: true })
  mihpayid?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  txnid?: string;

  @Column({ nullable: true })
  amount?: string;

  // UDF fields 1-10
  @Column({ nullable: true })
  udf1?: string;

  @Column({ nullable: true })
  udf2?: string;

  @Column({ nullable: true })
  udf3?: string;

  @Column({ nullable: true })
  udf4?: string;

  @Column({ nullable: true })
  udf5?: string;

  @Column({ nullable: true })
  udf6?: string;

  @Column({ nullable: true })
  udf7?: string;

  @Column({ nullable: true })
  udf8?: string;

  @Column({ nullable: true })
  udf9?: string;

  @Column({ nullable: true })
  udf10?: string;

  // Hash field is required (not nullable)
  @Column({ nullable: false })
  hash: string;

  // Field 1-9
  @Column({ nullable: true })
  field1?: string;

  @Column({ nullable: true })
  field2?: string;

  @Column({ nullable: true })
  field3?: string;

  @Column({ nullable: true })
  field4?: string;

  @Column({ nullable: true })
  field5?: string;

  @Column({ nullable: true })
  field6?: string;

  @Column({ nullable: true })
  field7?: string;

  @Column({ nullable: true })
  field8?: string;

  @Column({ nullable: true })
  field9?: string;

  @Column({ name: "payment_source", nullable: true })
  paymentSource?: string;

  @Column({ name: "bank_ref_num", nullable: true })
  bankRefNum?: string;

  @Column({ nullable: true })
  bankcode?: string;

  @Column({ nullable: true })
  error?: string;

  @Column({ name: "error_message", nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  cardnum?: string;

  // Foreign key to users table
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn({ name: "user_id" })
  user: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
