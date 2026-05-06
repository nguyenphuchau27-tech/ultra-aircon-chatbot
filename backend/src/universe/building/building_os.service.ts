import { Injectable } from '@nestjs/common';

@Injectable()
export class BuildingOSService {
  devices = [];

  registerDevice(device) {
    this.devices.push(device);
  }

  getDevices() {
    return this.devices;
  }
}



