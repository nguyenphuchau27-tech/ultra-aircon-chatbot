export class ChatbotService {
  diagnose(message: string) {
    message = message.toLowerCase();

    if (message.includes('not cold')) {
      return 'Possible gas leak or dirty filter';
    }

    if (message.includes('noise')) {
      return 'Fan motor issue';
    }

    return 'Need technician inspection';
  }
}



