export class SelfHealingService {
  check(service: boolean) {
    if (!service) {
      return 'restart';
    }

    return 'ok';
  }
}



