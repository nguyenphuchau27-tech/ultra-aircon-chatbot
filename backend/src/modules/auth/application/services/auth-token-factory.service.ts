import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { UserRole } from '../../../../database/entities/user.entity';
import { NestJwtServiceAdapter } from '../../infrastructure/services/jwt.service';

@Injectable()
export class AuthTokenFactoryService {
  private readonly jwtService: NestJwtServiceAdapter;

  constructor(jwtService: NestJwtServiceAdapter) {
    this.jwtService = jwtService;
  }

  generate(
    userId: number,
    role: UserRole,
    sessionId: string,
  ): {
    accessToken: string;
    refreshToken: string;
  } {
    const jti = randomUUID();

    const accessToken = this.jwtService.signAccessToken({
      sub: userId,
      role,
      sessionId,
      type: 'access',
    });

    const refreshToken = this.jwtService.signRefreshToken({
      sub: userId,
      sessionId,
      type: 'refresh',
      jti,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
