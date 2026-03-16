import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose, Transform } from "class-transformer";
import { User } from "../entities/user.entity";

@Exclude()
export class UserResponseDto {
  @ApiProperty({ description: "User ID" })
  @Expose()
  id: string;

  @ApiProperty({ description: "User first name" })
  @Expose()
  firstName: string;

  @ApiProperty({ description: "User last name" })
  @Expose()
  lastName: string;

  @ApiProperty({ description: "User email address" })
  @Expose()
  email: string;

  @ApiPropertyOptional({ description: "User phone number" })
  @Expose()
  phone?: string;

  @ApiProperty({ description: "Whether user email is verified" })
  @Expose()
  isVerified: boolean;

  @ApiProperty({ description: "Authentication provider used" })
  @Expose()
  authProvider: string;

  @ApiPropertyOptional({ description: "Profile picture URL" })
  @Expose()
  profilePicture?: string;

  @ApiPropertyOptional({ description: "Last login timestamp" })
  @Expose()
  lastLogin?: Date;

  @ApiProperty({ description: "Account creation timestamp" })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: "Account last update timestamp" })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: "User credits balance" })
  @Expose()
  credits: number;

  @ApiProperty({ description: "User monetary balance" })
  @Expose()
  balance: number;

  @ApiProperty({ description: "User role" })
  @Expose()
  role: string;

  @ApiPropertyOptional({ description: "Admin ID for sub-users" })
  @Expose()
  adminId?: string;

  @ApiPropertyOptional({ description: "Cost per minute for sub-users" })
  @Expose()
  costPerMinute?: number;

  @ApiPropertyOptional({ description: "Admin credits balance for sub-users" })
  @Expose()
  adminCredits?: number;

  @ApiPropertyOptional({ description: "Admin balance for sub-users" })
  @Expose()
  adminBalance?: number;

  @ApiProperty({ description: "User full name" })
  @Expose()
  @Transform(({ obj }) => `${obj.firstName} ${obj.lastName}`)
  fullName: string;

  constructor(user: User) {
    Object.assign(this, user);
  }
}
