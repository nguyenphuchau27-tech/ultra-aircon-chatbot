import { Injectable } from '@nestjs/common';

@Injectable()
export class MapsService {
  technicians: any[] = [];

  updateLocation(id: number, lat: number, lng: number) {
    const tech = this.technicians.find(t => t.id === id);

    if (tech) {
      tech.lat = lat;
      tech.lng = lng;
    }
  }

  nearby(lat: number, lng: number) {
    void lat;
    void lng;
    return this.technicians;
  }
}



