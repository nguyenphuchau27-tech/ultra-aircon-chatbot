export class Phone {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Phone {
    if (!value || typeof value !== 'string') {
      throw new Error('Phone must be a non-empty string');
    }

    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');

    // Basic validation - adjust regex based on your phone number format requirements
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(cleaned)) {
      throw new Error('Invalid phone number format');
    }

    return new Phone(cleaned);
  }

  toString(): string {
    return this._value;
  }

  equals(other: Phone): boolean {
    return this._value === other._value;
  }
}



