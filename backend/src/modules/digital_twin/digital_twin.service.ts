import { Injectable } from '@nestjs/common';

@Injectable()
export class DigitalTwinService {
  simulate(city) {
    return {
      city: city,
      predictedOrders: 120,
    };
  }
}



