import { ApiProperty } from '@nestjs/swagger';

class UserData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty()
  isVerified: boolean;
}

class AuthData {
  @ApiProperty({ type: UserData })
  user: UserData;

  @ApiProperty()
  token: string;
}

export class AuthResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: AuthData })
  data: AuthData;
}