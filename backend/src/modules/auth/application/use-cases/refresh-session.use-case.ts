import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { NestJwtServiceAdapter } from '../../infrastructure/services/jwt.service';
import { TypeOrmAuthSessionRepository } from '../../infrastructure/repositories/typeorm-auth-session.repository';
import { TypeOrmUserRepository } from '../../infrastructure/repositories/typeorm-user.repository';
import { BcryptHashingService } from '../../infrastructure/services/hashing.service';
import { AuthTokenFactoryService } from '../services/auth-token-factory.service';

@Injectable()
export class RefreshSessionUseCase {
  private readonly jwtService: NestJwtServiceAdapter;
  private readonly sessionRepository: TypeOrmAuthSessionRepository;
  private readonly userRepository: TypeOrmUserRepository;
  private readonly tokenFactory: AuthTokenFactoryService;
  private readonly hashingService: BcryptHashingService;

  constructor(
    jwtService: NestJwtServiceAdapter,
    sessionRepository: TypeOrmAuthSessionRepository,
    userRepository: TypeOrmUserRepository,
    tokenFactory: AuthTokenFactoryService,
    @Inject('HashingService') hashingService: BcryptHashingService,
  ) {
    this.jwtService = jwtService;
    this.sessionRepository = sessionRepository;
    this.userRepository = userRepository;
    this.tokenFactory = tokenFactory;
    this.hashingService = hashingService;
  }

  async execute(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = this.jwtService.verifyRefreshToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    const session = await this.sessionRepository.findById(payload.sessionId);

    if (!session || session.isRevoked) {
      throw new UnauthorizedException('Session is revoked');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await this.sessionRepository.revokeSession(payload.sessionId);
      throw new UnauthorizedException('Session expired');
    }

    const isMatched = await this.hashingService.compare(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isMatched) {
      await this.sessionRepository.revokeSession(session.id);
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const user = await this.userRepository.findByIdValue(payload.sub);

    if (!user) {
      await this.sessionRepository.revokeSession(session.id);
      throw new UnauthorizedException('User not found');
    }

    const tokens = this.tokenFactory.generate(user.id, user.role, session.id);

    session.refreshTokenHash = await this.hashingService.hash(tokens.refreshToken);
    session.lastUsedAt = new Date();

    await this.sessionRepository.save(session);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}