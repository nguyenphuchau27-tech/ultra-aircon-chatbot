import { Injectable } from '@nestjs/common';

@Injectable()
export class PartnerService {
  partners = [];

  register(partner) {
    this.partners.push(partner);

    return partner;
  }
}



