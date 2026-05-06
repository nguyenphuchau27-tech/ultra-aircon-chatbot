export class UserId {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  static generate(): UserId {
    // For now, we'll let the database generate auto-incrementing IDs
    // In a real application, this would generate a UUID
    throw new Error('Use fromNumber for existing IDs or let database generate');
  }

  static fromNumber(value: number): UserId {
    if (!value || typeof value !== 'number' || value <= 0) {
      throw new Error('UserId must be a positive number');
    }
    return new UserId(value);
  }

  static fromString(value: string): UserId {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      throw new Error('UserId string must be a valid number');
    }
    return UserId.fromNumber(numValue);
  }

  toString(): string {
    return this._value.toString();
  }

  toNumber(): number {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }
}



