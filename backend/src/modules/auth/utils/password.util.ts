import * as bcrypt from 'bcrypt';

const DEFAULT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

export function looksLikeBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, DEFAULT_SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  storedPassword: string,
): Promise<boolean> {
  if (!storedPassword) return false;

  if (!looksLikeBcryptHash(storedPassword)) {
    return false;
  }

  return bcrypt.compare(plainPassword, storedPassword);
}