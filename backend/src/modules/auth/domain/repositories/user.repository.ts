import type { UnaryFunction } from 'rxjs';
import { User } from '../../../../database/entities/user.entity';
import { UserId } from '../value-objects/user-id.value-object';
import { Email } from '../value-objects/email.value-object';
import { Phone } from '../value-objects/phone.value-object';

export interface UserRepository {
  save: UnaryFunction<User, Promise<void>>;
  findById: UnaryFunction<UserId, Promise<User | null>>;
  findByEmail: UnaryFunction<Email, Promise<User | null>>;
  findByPhone: UnaryFunction<Phone, Promise<User | null>>;
  existsByEmail: UnaryFunction<Email, Promise<boolean>>;
  existsByPhone: UnaryFunction<Phone, Promise<boolean>>;
  delete: UnaryFunction<UserId, Promise<void>>;
  findByIdValue: UnaryFunction<number, Promise<User | null>>;
}



