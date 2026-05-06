export class MarketplaceService {
  countries: any[] = [];

  addCountry(name: string) {
    this.countries.push({
      id: Date.now(),
      name,
    });
  }

  getCountries() {
    return this.countries;
  }
}



