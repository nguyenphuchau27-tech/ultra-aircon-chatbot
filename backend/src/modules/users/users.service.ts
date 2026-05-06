import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../database/entities/user.entity';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class UsersService {
  private readonly userRepo: Repository<User>;
  private readonly cacheService: CacheService;

  constructor(
    @InjectRepository(User)
    userRepo: Repository<User>,

    cacheService: CacheService,
  ) {
    this.userRepo = userRepo;
    this.cacheService = cacheService;
  }

  async create(data: Partial<User>) {
    const payload = { ...data };
    if (payload.password) {
      payload.password = await this.ensureHashedPassword(payload.password);
    }

    const user = this.userRepo.create(payload);
    const saved = await this.userRepo.save(user);
    await this.cacheService.del('users');
    return this.sanitizeUser(saved);
  }

  async findAll() {
    const cache = await this.cacheService.get('users');

    if (cache) {
      try {
        return JSON.parse(cache);
      } catch {
        await this.cacheService.del('users');
      }
    }

    const users = await this.userRepo.find();
    const sanitizedUsers = users.map(user => this.sanitizeUser(user));

    await this.cacheService.set('users', sanitizedUsers, 120);

    return sanitizedUsers;
  }

  async findById(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
    });
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email },
    });
  }

  async findByPhone(phone: string) {
    return this.userRepo.findOne({
      where: { phone },
    });
  }

  async update(id: number, data: Partial<User>) {
    const payload = { ...data };
    if (payload.password) {
      payload.password = await this.ensureHashedPassword(payload.password);
    }

    await this.userRepo.update(id, payload);
    await this.cacheService.del('users');

    return this.findById(id);
  }

  async delete(id: number) {
    const result = await this.userRepo.delete(id);
    await this.cacheService.del('users');
    return result;
  }

  private sanitizeUser(user: User | null) {
    if (!user) {
      return null;
    }
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  }

  private async ensureHashedPassword(password: string) {
    try {
      bcrypt.getRounds(password);
      return password;
    } catch {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(password, salt);
    }
  }
}



