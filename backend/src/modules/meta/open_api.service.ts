import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenAPIService {
  getServices() {
    return ['dispatch', 'pricing', 'technician_search', 'order_create'];
  }
}



