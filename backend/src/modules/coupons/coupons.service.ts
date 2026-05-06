import { Injectable } from '@nestjs/common';

@Injectable()
export class CouponsService {
  validate(code: string) {
    if (code === 'AIRCON10') {
      return {
        discount: 10,
      };
    }

    return null;
  }
}



