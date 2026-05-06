import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../database/entities/user.entity';

import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CacheModule],
  providers: [UsersService],
  controllers: [UsersController],

  exports: [UsersService], // ⭐ QUAN TRỌNG
})
export class UsersModule {}



