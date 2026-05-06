import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { UserRole } from '../../../../database/entities/user.entity';

export interface AccessTokenPayload {
  sub: number;
  role: UserRole;
  sessionId: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: number;
  sessionId: string;
  type: 'refresh';
  jti: string;
}

@Injectable()
export class NestJwtServiceAdapter {
  private readonly jwtService: NestJwtService;

  constructor(jwtService: NestJwtService) {
    this.jwtService = jwtService;
  }

  signAccessToken(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
    });
  }

  signRefreshToken(payload: RefreshTokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.jwtService.verify<AccessTokenPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

export interface JwtService {
  signAccessToken(_payload: AccessTokenPayload): string;
  signRefreshToken(_payload: RefreshTokenPayload): string;
  verifyAccessToken(_token: string): AccessTokenPayload;
  verifyRefreshToken(_token: string): RefreshTokenPayload;
}
