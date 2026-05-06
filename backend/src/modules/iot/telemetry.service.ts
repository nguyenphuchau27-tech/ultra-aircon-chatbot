export class TelemetryService {
  logs: any[] = [];

  push(data: any) {
    this.logs.push(data);
  }

  latest(deviceId: number) {
    return this.logs.filter(l => l.deviceId === deviceId);
  }
}



