import { Injectable } from '@nestjs/common';

import { DispatchService } from '../ai-engine/dispatch.service';
import { TechniciansService } from '../technicians/technicians.service';
import { SocketGateway } from '../realtime/socket.gateway';

@Injectable()
export class AutoDispatchService {
  private readonly dispatchService: DispatchService;
  private readonly techService: TechniciansService;
  private readonly socketGateway: SocketGateway;

  constructor(
    dispatchService: DispatchService,
    techService: TechniciansService,
    socketGateway: SocketGateway,
  ) {
    this.dispatchService = dispatchService;
    this.techService = techService;
    this.socketGateway = socketGateway;
  }

  async dispatchOrder(order, customerLat, customerLng) {
    const technicians = await this.techService.findAvailable();

    const tech = this.dispatchService.findNearestTech(customerLat, customerLng, technicians);

    if (!tech) {
      return { error: 'No technician available' };
    }

    this.socketGateway.sendOrderToTech(tech.id, order);

    return {
      assignedTech: tech,
    };
  }
}



