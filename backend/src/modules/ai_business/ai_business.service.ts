import { Injectable } from '@nestjs/common';

@Injectable()
export class AIBusinessService {
  optimize(cityStats) {
    if (cityStats.orders < 50) {
      return 'PROMOTION';
    }

    if (cityStats.orders > 500) {
      return 'PRICE_INCREASE';
    }

    return 'STABLE';
  }
}



