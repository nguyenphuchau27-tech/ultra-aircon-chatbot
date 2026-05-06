import { Module } from '@nestjs/common';

import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TechniciansModule } from '../technicians/technicians.module';
import { SocketModule } from './socket.module';

@Module({
  imports: [TechniciansModule, SocketModule],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class RealtimeModule {}
