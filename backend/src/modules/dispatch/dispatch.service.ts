import { Injectable } from '@nestjs/common';

interface Technician {
  id: number;
  lat: number;
  lng: number;
  rating: number;
  activeJobs: number;
}

@Injectable()
export class DispatchService {
  private score(distance: number, rating: number, workload: number) {
    return rating * 2 - distance - workload;
  }

  private findBest(customer: any, technicians: Technician[]) {
    let best: Technician | null = null;
    let bestScore = -999;

    for (const tech of technicians) {
      const dist = Math.sqrt(
        Math.pow(customer.lat - tech.lat, 2) + Math.pow(customer.lng - tech.lng, 2),
      );

      const s = this.score(dist, tech.rating, tech.activeJobs);

      if (s > bestScore) {
        bestScore = s;
        best = tech;
      }
    }

    return best;
  }

  findNearestTechnician(lat: number, lng: number) {
    // giả lập danh sách technician (sau này lấy từ database)
    const technicians: Technician[] = [
      { id: 12, lat: 10.776, lng: 106.7, rating: 4.8, activeJobs: 1 },
      { id: 13, lat: 10.78, lng: 106.695, rating: 4.5, activeJobs: 0 },
      { id: 14, lat: 10.77, lng: 106.71, rating: 4.9, activeJobs: 2 },
    ];

    const customer = { lat, lng };

    const best = this.findBest(customer, technicians);

    if (!best) {
      return null;
    }

    const distance = Math.sqrt(Math.pow(lat - best.lat, 2) + Math.pow(lng - best.lng, 2));

    return {
      technicianId: best.id,
      distance: Number(distance.toFixed(2)),
      rating: best.rating,
      workload: best.activeJobs,
    };
  }
}



