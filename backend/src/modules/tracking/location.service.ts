export class LocationService {
  private locations = {};

  updateLocation(techId: number, lat: number, lng: number) {
    this.locations[techId] = { lat, lng };
  }

  getLocation(techId: number) {
    return this.locations[techId];
  }
}



