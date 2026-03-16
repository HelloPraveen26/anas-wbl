import { IsString, IsOptional, MinLength } from 'class-validator';
import { PartialType, OmitType, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ["email", "verificationToken"] as const),
) {
  @ApiPropertyOptional({ description: 'New password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
