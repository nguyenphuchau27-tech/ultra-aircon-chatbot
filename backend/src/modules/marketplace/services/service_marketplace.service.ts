import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiceMarketplace {
  services = ['Aircon Repair', 'Electrical', 'Plumbing', 'Appliance Repair'];

  list() {
    return this.services;
  }
}



