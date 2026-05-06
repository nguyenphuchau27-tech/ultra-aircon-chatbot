export class UserRole {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static customer(): UserRole {
    return new UserRole('customer');
  }

  static technician(): UserRole {
    return new UserRole('technician');
  }

  static admin(): UserRole {
    return new UserRole('admin');
  }

  static fromString(value: string): UserRole {
    const validRoles = ['customer', 'technician', 'admin'];
    if (!validRoles.includes(value)) {
      throw new Error(`Invalid role: ${value}. Must be one of: ${validRoles.join(', ')}`);
    }
    return new UserRole(value);
  }

  toString(): string {
    return this._value;
  }

  equals(other: UserRole): boolean {
    return this._value === other._value;
  }

  isCustomer(): boolean {
    return this._value === 'customer';
  }

  isTechnician(): boolean {
    return this._value === 'technician';
  }

  isAdmin(): boolean {
    return this._value === 'admin';
  }
}



