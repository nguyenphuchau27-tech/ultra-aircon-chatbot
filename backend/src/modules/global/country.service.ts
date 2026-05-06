import { Injectable } from '@nestjs/common';

@Injectable()
export class CountryService {
  getCountryConfig(country: string) {
    const configs = {
      VN: {
        currency: 'VND',
        tax: 0.1,
        language: 'vi',
      },

      US: {
        currency: 'USD',
        tax: 0.07,
        language: 'en',
      },

      SG: {
        currency: 'SGD',
        tax: 0.08,
        language: 'en',
      },
    };

    return configs[country] || configs['VN'];
  }
}



