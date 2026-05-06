export class DeviceService {
  devices: any[] = [];

  register(device: any) {
    this.devices.push(device);
  }

  getDevices(userId: number) {
    return this.devices.filter(d => d.userId === userId);
  }
}



