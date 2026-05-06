import { Injectable } from '@nestjs/common';

@Injectable()
export class DispatchService {
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // từ code 5
  selectTechnician(techs: any[]) {
    return techs.sort((a, b) => b.rating - a.rating)[0];
  }

  findNearestTech(customerLat, customerLng, technicians) {
    let bestTech = null;
    let bestDistance = Infinity;

    technicians.forEach(t => {
      const distance = this.calculateDistance(customerLat, customerLng, t.latitude, t.longitude);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestTech = t;
      }
    });

    return bestTech;
  }
}



