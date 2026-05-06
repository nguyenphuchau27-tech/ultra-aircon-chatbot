import { Injectable } from '@nestjs/common';

@Injectable()
export class UniverseCoreService {
  systems = ['aircon', 'electric', 'water', 'iot_devices', 'energy_grid'];

  getSystems() {
    return this.systems;
  }
}



