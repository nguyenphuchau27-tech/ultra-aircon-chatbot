import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../../database/entities/user.entity';
import { AuthSession } from '../../database/entities/auth-session.entity';

import { AuthController } from './api/controllers/auth.controller';

import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { LogoutSessionUseCase } from './application/use-cases/logout-session.use-case';
import { LogoutAllSessionsUseCase } from './application/use-cases/logout-all-sessions.use-case';
import { AuthTokenFactoryService } from './application/services/auth-token-factory.service';

import { TypeOrmUserRepository } from './infrastructure/repositories/typeorm-user.repository';
import { TypeOrmAuthSessionRepository } from './infrastructure/repositories/typeorm-auth-session.repository';
import { BcryptHashingService } from './infrastructure/services/hashing.service';
import { NestJwtServiceAdapter } from './infrastructure/services/jwt.service';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuthSession]), PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshSessionUseCase,
    LogoutSessionUseCase,
    LogoutAllSessionsUseCase,
    AuthTokenFactoryService,
    TypeOrmUserRepository,
    TypeOrmAuthSessionRepository,
    JwtStrategy,
    {
      provide: 'HashingService',
      useClass: BcryptHashingService,
    },
    NestJwtServiceAdapter,
  ],
  exports: [NestJwtServiceAdapter],
})
export class AuthModule {}



