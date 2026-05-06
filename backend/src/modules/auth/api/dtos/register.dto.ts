import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { UserRole, UserStatus } from '../../../../database/entities/user.entity';

export class RegisterRequestDto {
  @IsString()
  name: string;

  @ValidateIf((o: RegisterRequestDto) => !o.phone)
  @IsOptional()
  @IsEmail()
  email?: string;

  @ValidateIf((o: RegisterRequestDto) => !o.email)
  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterResponseDto {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}



