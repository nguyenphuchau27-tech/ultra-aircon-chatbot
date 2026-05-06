export class EdgeNode {
  constructor(city) {
    this.city = city;
  }

  process(data) {
    return {
      city: this.city,
      status: 'processed',
    };
  }
}


