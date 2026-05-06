import { Injectable } from '@nestjs/common';
import { User } from '../../../../database/entities/user.entity';

@Injectable()
export class AuthDomainService {
  validateUserStatus(user: User): void {
    if (user.status !== 'active') {
      throw new Error('User is not active');
    }
  }
}



