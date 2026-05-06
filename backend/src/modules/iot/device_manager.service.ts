export class DeviceManager {
  devices: any[] = [];

  register(device: any) {
    this.devices.push(device);
  }

  count() {
    return this.devices.length;
  }
}



