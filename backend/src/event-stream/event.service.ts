export class EventService {
  events: any[] = [];

  publish(event: any) {
    this.events.push(event);
  }

  consume() {
    return this.events;
  }
}



