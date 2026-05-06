import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { TypeOrmUserRepository } from '../../infrastructure/repositories/typeorm-user.repository';
import { TypeOrmAuthSessionRepository } from '../../infrastructure/repositories/typeorm-auth-session.repository';
import { BcryptHashingService } from '../../infrastructure/services/hashing.service';
import { AuthTokenFactoryService } from '../services/auth-token-factory.service';
import { LoginRequestDto, LoginResponseDto } from '../../api/dtos/login.dto';
import { UserStatus } from '../../../../database/entities/user.entity';

export type LoginUserCommand = LoginRequestDto;
export type LoginUserResult = LoginResponseDto;

function looksLikeBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

@Injectable()
export class LoginUserUseCase {
  private readonly userRepository: TypeOrmUserRepository;
  private readonly sessionRepository: TypeOrmAuthSessionRepository;
  private readonly tokenFactory: AuthTokenFactoryService;
  private readonly hashingService: BcryptHashingService;

  constructor(
    userRepository: TypeOrmUserRepository,
    sessionRepository: TypeOrmAuthSessionRepository,
    tokenFactory: AuthTokenFactoryService,
    @Inject('HashingService') hashingService: BcryptHashingService,
  ) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
    this.tokenFactory = tokenFactory;
    this.hashingService = hashingService;
  }

  async execute(
    dto: LoginUserCommand,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<LoginUserResult> {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();

    if (!email && !phone) {
      throw new UnauthorizedException('Email hoặc số điện thoại là bắt buộc');
    }

    const user = email
      ? await this.userRepository.findByEmailValue(email)
      : await this.userRepository.findByPhoneValue(phone || '');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Account is blocked');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    if (!user.password || !looksLikeBcryptHash(user.password)) {
      throw new UnauthorizedException(
        'Account password is stored in legacy format. Please migrate or reset password.',
      );
    }

    const isValidPassword = await this.hashingService.compare(dto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tempRefresh = randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await this.sessionRepository.createSession({
      userId: user.id,
      refreshTokenHash: await this.hashingService.hash(tempRefresh),
      appType: dto.appType?.trim() || 'unknown',
      deviceType: dto.deviceType?.trim() || 'unknown',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      expiresAt,
      isRevoked: false,
      lastUsedAt: new Date(),
    });

    const tokens = this.tokenFactory.generate(user.id, user.role, session.id);

    await this.sessionRepository.updateSession(session.id, {
      refreshTokenHash: await this.hashingService.hash(tokens.refreshToken),
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    };
  }
}