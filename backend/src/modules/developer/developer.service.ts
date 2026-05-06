import { Injectable } from '@nestjs/common';

@Injectable()
export class DeveloperService {
  apps = [];

  registerApp(app) {
    this.apps.push(app);

    return app;
  }

  getApps() {
    return this.apps;
  }
}



