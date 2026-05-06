import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { UserRole, UserStatus } from '../../../../database/entities/user.entity';

export class LoginRequestDto {
  @ValidateIf((o: LoginRequestDto) => !o.phone)
  @IsOptional()
  @IsString()
  email?: string;

  @ValidateIf((o: LoginRequestDto) => !o.email)
  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  appType?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
  };
}