import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptHashingService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = Number(process.env.BCRYPT_ROUNDS || 12);
  }

  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.saltRounds);
  }

  async compare(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }
}

export interface HashingService {
  hash(_value: string): Promise<string>;
  compare(_raw: string, _hashed: string): Promise<boolean>;
}
