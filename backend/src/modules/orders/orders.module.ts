import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from '../../database/entities/order.entity';
import { Technician } from '../../database/entities/technician.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CommonModule } from '../../common/common.module';
import { CacheModule } from '../cache/cache.module';
import { SocketModule } from '../realtime/socket.module';
import { TechniciansModule } from '../technicians/technicians.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Technician]),
    CommonModule,
    CacheModule,
    SocketModule,
    TechniciansModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
