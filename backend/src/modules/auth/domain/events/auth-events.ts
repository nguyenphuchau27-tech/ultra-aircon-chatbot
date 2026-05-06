import { UserId } from '../value-objects/user-id.value-object';

export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;

  constructor() {
    this.occurredAt = new Date();
    this.eventId = globalThis.crypto?.randomUUID() || Math.random().toString(36);
  }

  abstract get eventType(): string;
}

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId, // eslint-disable-line no-unused-vars
    public readonly phone: string, // eslint-disable-line no-unused-vars
    public readonly email?: string, // eslint-disable-line no-unused-vars
  ) {
    super();
  }

  get eventType(): string {
    return 'UserRegistered';
  }
}

export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId, // eslint-disable-line no-unused-vars
    public readonly loginMethod: 'email' | 'phone', // eslint-disable-line no-unused-vars
  ) {
    super();
  }

  get eventType(): string {
    return 'UserLoggedIn';
  }
}



