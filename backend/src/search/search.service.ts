export class SearchService {
  technicians: any[] = [];

  searchByCity(city: string) {
    return this.technicians.filter(t => t.city === city);
  }
}



