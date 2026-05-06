import { Injectable } from '@nestjs/common';

@Injectable()
export class CityService {
  cities = [];

  registerCity(city) {
    this.cities.push(city);

    return city;
  }

  listCities() {
    return this.cities;
  }
}



