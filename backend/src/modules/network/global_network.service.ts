import { Injectable } from '@nestjs/common';

@Injectable()
export class GlobalNetworkService {
  cities: any[] = [];

  technicians: any[] = [];

  registerCity(city: string, country: string) {
    this.cities.push({
      id: Date.now(),
      city,
      country,
    });
  }

  listCities() {
    return this.cities;
  }

  registerTech(tech) {
    this.technicians.push({
      id: Date.now(),
      ...tech,
    });
  }

  getNearby(city) {
    return this.technicians.filter(t => t.city === city);
  }
}



