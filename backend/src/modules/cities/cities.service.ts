export class CitiesService {
  private cities = [
    { id: 1, name: 'Ho Chi Minh' },
    { id: 2, name: 'Ha Noi' },
    { id: 3, name: 'Da Nang' },
  ];

  getCities() {
    return this.cities;
  }
}



