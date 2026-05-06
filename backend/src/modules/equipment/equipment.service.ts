import { Injectable } from '@nestjs/common';

@Injectable()
export class EquipmentService {
  products = [
    { name: 'AC Compressor', price: 2000000 },
    { name: 'Gas R32', price: 500000 },
  ];

  list() {
    return this.products;
  }
}



