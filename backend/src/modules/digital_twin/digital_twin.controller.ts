import { Controller, Get } from '@nestjs/common';
import { DigitalTwinService } from './digital_twin.service';

@Controller('twin')
export class DigitalTwinController {
  private readonly twin: DigitalTwinService;

  constructor(twin: DigitalTwinService) {
    this.twin = twin;
  }

  @Get()
  run() {
    return this.twin.simulate('HCM');
  }
}



