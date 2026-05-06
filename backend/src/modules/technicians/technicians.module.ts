import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Technician } from '../../database/entities/technician.entity';

import { TechniciansService } from './technicians.service';
import { TechniciansController } from './technicians.controller';
import { CommonModule } from '../../common/common.module';
import { CacheModule } from '../cache/cache.module';
import { SocketModule } from '../realtime/socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Technician]),
    CommonModule,
    CacheModule,
    SocketModule,
  ],
  providers: [TechniciansService],
  controllers: [TechniciansController],
  exports: [TechniciansService],
})
export class TechniciansModule {}