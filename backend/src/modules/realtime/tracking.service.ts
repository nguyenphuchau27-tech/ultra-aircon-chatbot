import { Injectable, NotFoundException } from '@nestjs/common';
import { TechniciansService } from '../technicians/technicians.service';

@Injectable()
export class TrackingService {
  private readonly techniciansService: TechniciansService;

  constructor(techniciansService: TechniciansService) {
    this.techniciansService = techniciansService;
  }

  async updateLocation(techId: number, lat: number, lng: number) {
    return this.techniciansService.updateLocation(techId, lat, lng);
  }

  async getLocation(techId: number) {
    const locations = await this.techniciansService.findAllLocations();
    const location = locations.find(item => item.id === techId);

    if (!location) {
      throw new NotFoundException('Technician location not found');
    }

    return location;
  }

  async getAllLocations() {
    return this.techniciansService.findAllLocations();
  }
}