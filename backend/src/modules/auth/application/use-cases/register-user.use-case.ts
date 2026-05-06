import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { TypeOrmUserRepository } from '../../infrastructure/repositories/typeorm-user.repository';
import { BcryptHashingService } from '../../infrastructure/services/hashing.service';
import { RegisterRequestDto, RegisterResponseDto } from '../../api/dtos/register.dto';
import { UserRole, UserStatus } from '../../../../database/entities/user.entity';

export type RegisterUserCommand = RegisterRequestDto;
export type RegisterUserResult = RegisterResponseDto;

@Injectable()
export class RegisterUserUseCase {
  private readonly userRepository: TypeOrmUserRepository;
  private readonly hashingService: BcryptHashingService;

  constructor(
    userRepository: TypeOrmUserRepository,
    @Inject('HashingService') hashingService: BcryptHashingService,
  ) {
    this.userRepository = userRepository;
    this.hashingService = hashingService;
  }

  async execute(dto: RegisterUserCommand): Promise<RegisterUserResult> {
    const name = dto.name?.trim();
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();

    if (!name) {
      throw new BadRequestException('Tên là bắt buộc');
    }

    if (!email && !phone) {
      throw new BadRequestException('Email hoặc số điện thoại là bắt buộc');
    }

    if (email) {
      const existingByEmail = await this.userRepository.findByEmailValue(email);
      if (existingByEmail) {
        throw new ConflictException('Email đã tồn tại');
      }
    }

    if (phone) {
      const existingByPhone = await this.userRepository.findByPhoneValue(phone);
      if (existingByPhone) {
        throw new ConflictException('Số điện thoại đã tồn tại');
      }
    }

    const passwordHash = await this.hashingService.hash(dto.password);

    const created = await this.userRepository.createAndSave({
      name,
      email,
      phone,
      password: passwordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      role: created.role,
      status: created.status,
      createdAt: created.createdAt,
    };
  }
}