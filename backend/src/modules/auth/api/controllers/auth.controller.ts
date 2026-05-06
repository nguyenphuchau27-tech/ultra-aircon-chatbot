import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  SetMetadata,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { RegisterUserUseCase, LoginUserUseCase } from '../../application';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { LogoutSessionUseCase } from '../../application/use-cases/logout-session.use-case';
import { LogoutAllSessionsUseCase } from '../../application/use-cases/logout-all-sessions.use-case';

import {
  RegisterRequestDto,
  RegisterResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenRequestDto,
} from '../dtos';

import { JwtGuard } from '../../../../common/guards/jwt.guard';
import {
  clearAuthCookies,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from '../../utils/auth-cookie.util';

const Public = () => SetMetadata('isPublic', true);

type AuthenticatedRequest = Request & {
  user?: {
    userId?: number;
    role?: string;
    sessionId?: string;
  };
  cookies?: Record<string, string>;
};

function getIpAddress(req: Request): string | undefined {
  const request = req as Request & {
    headers?: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string | undefined };
    connection?: { remoteAddress?: string | undefined };
    ip?: string | undefined;
  };

  const forwardedFor = request.headers?.['x-forwarded-for'];
  const realIp = request.headers?.['x-real-ip'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim() || undefined;
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.trim() || undefined;
  }

  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return (
    request.ip ||
    request.socket?.remoteAddress ||
    request.connection?.remoteAddress ||
    undefined
  );
}

function getUserAgent(req: Request): string | undefined {
  const request = req as Request & {
    headers?: Record<string, string | string[] | undefined>;
  };

  const userAgent = request.headers?.['user-agent'];

  if (typeof userAgent === 'string' && userAgent.trim()) {
    return userAgent.trim();
  }

  if (Array.isArray(userAgent) && userAgent.length > 0) {
    return userAgent[0]?.trim() || undefined;
  }

  return undefined;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutSessionUseCase: LogoutSessionUseCase,
    private readonly logoutAllSessionsUseCase: LogoutAllSessionsUseCase,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.registerUserUseCase.execute(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.loginUserUseCase.execute(dto, {
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenRequestDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = dto.refreshToken || req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const result = await this.refreshSessionUseCase.execute(refreshToken);

    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    return result;
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const sessionId = req.user?.sessionId;

    if (!sessionId) {
      throw new UnauthorizedException('Session not found');
    }

    await this.logoutSessionUseCase.execute(sessionId);
    clearAuthCookies(res);

    return { success: true };
  }

  @Post('logout-all')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    const userId = req.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    await this.logoutAllSessionsUseCase.execute(userId);
    clearAuthCookies(res);

    return { success: true };
  }
}