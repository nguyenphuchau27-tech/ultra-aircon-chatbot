import { Injectable } from '@nestjs/common';
import { TypeOrmAuthSessionRepository } from '../../infrastructure/repositories/typeorm-auth-session.repository';

@Injectable()
export class LogoutAllSessionsUseCase {
  private readonly sessionRepository: TypeOrmAuthSessionRepository;

  constructor(sessionRepository: TypeOrmAuthSessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async execute(userId: number): Promise<void> {
    await this.sessionRepository.revokeAllUserSessions(userId);
  }
}



