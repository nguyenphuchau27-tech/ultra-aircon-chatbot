import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { logger } from '../logger/logger';

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn('Missing authorization header');
      throw new UnauthorizedException('Authorization header is required');
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

    if (!token) {
      logger.warn('Invalid authorization header format');
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }

      // Verify token with expiration
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'],
        issuer: process.env.JWT_ISSUER || 'ultra-aircon',
        audience: process.env.JWT_AUDIENCE || 'ultra-aircon-api',
      });

      req.user = decoded;
      return true;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token expired', { expiryTime: error.expiredAt });
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid token', { message: error.message });
        throw new UnauthorizedException('Invalid token');
      }
      logger.error('JWT verification failed', { error });
      throw new UnauthorizedException('Invalid token');
    }
  }
}
