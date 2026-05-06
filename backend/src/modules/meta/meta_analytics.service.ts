import { Injectable } from '@nestjs/common';

@Injectable()
export class MetaAnalyticsService {
  stats(data) {
    return {
      apps: data.apps,
      developers: data.developers,
      partners: data.partners,
    };
  }
}



