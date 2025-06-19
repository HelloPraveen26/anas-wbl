import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'New password', example: 'NewSecurePassword123!' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;
}