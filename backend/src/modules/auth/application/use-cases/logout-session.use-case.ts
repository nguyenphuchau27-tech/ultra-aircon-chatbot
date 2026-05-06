import { Injectable } from '@nestjs/common';
import { TypeOrmAuthSessionRepository } from '../../infrastructure/repositories/typeorm-auth-session.repository';

@Injectable()
export class LogoutSessionUseCase {
  private readonly sessionRepository: TypeOrmAuthSessionRepository;

  constructor(sessionRepository: TypeOrmAuthSessionRepository) {
    this.sessionRepository = sessionRepository;
  }
  async execute(sessionId: string): Promise<void> {
    await this.sessionRepository.revokeSession(sessionId);
  }
}



