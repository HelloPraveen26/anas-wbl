import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { Exclude } from "class-transformer";
import { RegisteredNumber } from "../../registered-numbers/entities/registered-number.entity";
import { ContactNumber } from "../../contact-numbers/entities/contact-number.entity";
import { CallLog } from "../../call-logs/entities/call-log.entity";

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

@Entity("users")
@Index(["email"], { unique: true })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "first_name", length: 100 })
  firstName: string;

  @Column({ name: "last_name", length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ name: "is_verified", default: false })
  isVerified: boolean;

  @Column({ name: "verification_token", nullable: true })
  @Exclude()
  verificationToken?: string;

  @Column({ name: "reset_password_token", nullable: true })
  @Exclude()
  resetPasswordToken?: string;

  @Column({ name: "reset_password_expires", type: "timestamp", nullable: true })
  @Exclude()
  resetPasswordExpires?: Date;

  @Column({
    name: "auth_provider",
    type: "enum",
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider: AuthProvider;

  @Column({ name: "google_id", nullable: true })
  @Exclude()
  googleId?: string;

  @Column({ name: "profile_picture", nullable: true })
  profilePicture?: string;

  @Column({ name: "last_login", type: "timestamp", nullable: true })
  lastLogin?: Date;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany("Assistant", "user")
  assistants: any[];

  @OneToMany(
    () => RegisteredNumber,
    (registeredNumber) => registeredNumber.user,
  )
  registeredNumbers: RegisteredNumber[];

  @OneToMany(() => ContactNumber, (contactNumber) => contactNumber.user)
  contactNumbers: ContactNumber[];

  @OneToMany(() => CallLog, (callLog) => callLog.user)
  callLogs: CallLog[];

  // Virtual field for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
