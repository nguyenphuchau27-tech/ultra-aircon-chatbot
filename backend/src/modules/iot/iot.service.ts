import { Injectable } from '@nestjs/common';

@Injectable()
export class IoTService {
  devices = [];

  register(device) {
    this.devices.push(device);

    return device;
  }

  getDevices() {
    return this.devices;
  }
}



