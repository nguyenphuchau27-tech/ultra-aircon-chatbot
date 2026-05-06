export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Email {
    if (!value || typeof value !== 'string') {
      throw new Error('Email must be a non-empty string');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }

    return new Email(value.toLowerCase().trim());
  }

  toString(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}



