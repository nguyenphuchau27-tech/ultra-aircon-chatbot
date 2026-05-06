import { Injectable } from '@nestjs/common';

@Injectable()
export class AppMarketplaceService {
  apps = [];

  publish(app) {
    this.apps.push(app);

    return app;
  }

  list() {
    return this.apps;
  }
}



