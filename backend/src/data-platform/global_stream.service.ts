export class DataLakeService {
  events: any[] = [];
  records: any[] = [];

  // ===== Event storage =====

  storeEvent(event: any) {
    this.events.push(event);
  }

  getEvents() {
    return this.events;
  }

  // ===== GlobalStream compatibility =====

  push(event: any) {
    this.storeEvent(event);
  }

  all() {
    return this.getEvents();
  }

  // ===== Generic data lake =====

  store(data: any) {
    this.records.push(data);
  }

  size() {
    return this.records.length;
  }
}



