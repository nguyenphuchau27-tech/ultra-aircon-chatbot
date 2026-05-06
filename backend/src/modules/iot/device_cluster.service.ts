export class DeviceCluster {
  devices: any[] = [];

  add(device: any) {
    this.devices.push(device);
  }

  total() {
    return this.devices.length;
  }
}



