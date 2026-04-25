import { IsString, IsOptional, MinLength } from 'class-validator';
import { PartialType, OmitType, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";
import { Transform } from 'class-transformer';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ["email", "verificationToken"] as const),
) {
  @ApiPropertyOptional({ description: 'New password' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
