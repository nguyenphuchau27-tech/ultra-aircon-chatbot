import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthSession } from '../../../../database/entities/auth-session.entity';

@Injectable()
export class TypeOrmAuthSessionRepository {
  private readonly repo: Repository<AuthSession>;

  constructor(@InjectRepository(AuthSession) repo: Repository<AuthSession>) {
    this.repo = repo;
  }

  async createSession(data: Partial<AuthSession>): Promise<AuthSession> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<AuthSession | null> {
    return this.repo.findOne({ where: { id } });
  }

  async save(session: AuthSession): Promise<AuthSession> {
    return this.repo.save(session);
  }

  async updateSession(id: string, data: Partial<AuthSession>): Promise<void> {
    await this.repo.update({ id }, data);
  }

  async revokeSession(id: string): Promise<void> {
    await this.repo.update({ id }, { isRevoked: true });
  }

  async revokeAllUserSessions(userId: number): Promise<void> {
    await this.repo.update({ userId }, { isRevoked: true });
  }
}
