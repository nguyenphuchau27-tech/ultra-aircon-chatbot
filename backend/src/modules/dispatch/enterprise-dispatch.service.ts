import { Injectable } from '@nestjs/common';

@Injectable()
export class EnterpriseDispatchService {
  scoreTechnician(order, tech) {
    let score = 0;

    score += this.distanceScore(order, tech);
    score += this.ratingScore(tech);
    score += this.performanceScore(tech);
    score += this.availabilityScore(tech);

    return score;
  }

  distanceScore(order, tech) {
    const d = Math.sqrt(Math.pow(order.lat - tech.lat, 2) + Math.pow(order.lng - tech.lng, 2));

    return 100 - d;
  }

  ratingScore(tech) {
    return tech.rating * 10;
  }

  performanceScore(tech) {
    return tech.completedJobs;
  }

  availabilityScore(tech) {
    return tech.available ? 50 : 0;
  }
}



