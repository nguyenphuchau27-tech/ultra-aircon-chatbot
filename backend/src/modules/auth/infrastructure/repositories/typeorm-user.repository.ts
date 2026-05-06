import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../database/entities/user.entity';

@Injectable()
export class TypeOrmUserRepository {
  private readonly repository: Repository<User>;

  constructor(@InjectRepository(User) repository: Repository<User>) {
    this.repository = repository;
  }

  async findById(id: number): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByEmailValue(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      select: [
        'id',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findByPhoneValue(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: { phone },
      select: [
        'id',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async createAndSave(data: Partial<User>): Promise<User> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(user: Partial<User>): Promise<User> {
    return this.repository.save(user);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async findByIdValue(id: number): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
    });
  }
}



