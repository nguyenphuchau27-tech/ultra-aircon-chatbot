import { Body, Controller, Post } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class LocationController {
  private readonly service: MapsService;

  constructor(service: MapsService) {
    this.service = service;
  }

  @Post('update')
  update(@Body() dto: any) {
    return this.service.updateLocation(dto.technicianId, dto.lat, dto.lng);
  }
}



