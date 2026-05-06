import { Injectable } from '@nestjs/common';

@Injectable()
export class UniverseAnalytics {
  report(data) {
    return {
      cities: data.cities,
      devices: data.devices,
      orders: data.orders,
    };
  }
}



