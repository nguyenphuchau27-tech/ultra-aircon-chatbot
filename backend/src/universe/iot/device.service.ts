import { Injectable } from '@nestjs/common';

@Injectable()
export class DeviceService {
  devices = [];

  connect(device) {
    this.devices.push(device);

    return device;
  }

  status() {
    return this.devices.length;
  }
}



