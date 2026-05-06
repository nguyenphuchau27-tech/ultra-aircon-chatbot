export class AnalyticsService {
  metrics: any[] = [];

  log(metric: any) {
    this.metrics.push(metric);
  }

  stats() {
    return this.metrics;
  }
}



