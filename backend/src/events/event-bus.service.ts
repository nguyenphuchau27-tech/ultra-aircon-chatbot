export class EventBus {
  publish(event: string, data: any) {
    console.log('event:', event, data);
  }
}



