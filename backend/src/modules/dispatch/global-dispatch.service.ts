interface Technician {
  id: number;
  rating: number;
  lat: number;
  lng: number;
  jobs: number;
}

export class GlobalDispatchService {
  calculateScore(distance: number, rating: number, load: number) {
    return rating * 3 - distance - load * 2;
  }

  findTechnician(customer: any, techs: Technician[]) {
    let best = null;
    let bestScore = -999;

    for (const t of techs) {
      const dist = Math.sqrt(Math.pow(customer.lat - t.lat, 2) + Math.pow(customer.lng - t.lng, 2));

      const score = this.calculateScore(dist, t.rating, t.jobs);

      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    }

    return best;
  }
}



