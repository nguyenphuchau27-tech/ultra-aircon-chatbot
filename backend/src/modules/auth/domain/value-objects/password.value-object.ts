export class Password {
  private readonly _hashedValue: string;

  private constructor(hashedValue: string) {
    this._hashedValue = hashedValue;
  }

  static fromPlainText(plainText: string): Password {
    if (!plainText || typeof plainText !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (plainText.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Note: Actual hashing should be done by the infrastructure layer
    // This is just a placeholder - the real hash will be set later
    return new Password('PLACEHOLDER_HASH');
  }

  static fromHash(hashedValue: string): Password {
    if (!hashedValue || typeof hashedValue !== 'string') {
      throw new Error('Hashed password must be a non-empty string');
    }

    return new Password(hashedValue);
  }

  toHash(): string {
    return this._hashedValue;
  }

  // Note: Password comparison should be done by the infrastructure layer
  // This method is for domain logic only
  equals(other: Password): boolean {
    return this._hashedValue === other._hashedValue;
  }
}



