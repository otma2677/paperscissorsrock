/**
 *
 */
import { promisify } from 'node:util';
import { randomBytes, pbkdf2, timingSafeEqual } from 'node:crypto';

/**
 *
 */
export const pbkdf2Async = promisify(pbkdf2);

export async function generatePassword(password: string, salt?: string, iterations = 210_000) {
  const bytesPassword = Buffer.from(password);
  const bytesSalt = salt ? Buffer.from(salt, 'hex') : randomBytes(64);

  const bytesFinal = await pbkdf2Async(
    bytesPassword,
    bytesSalt,
    iterations,
    64,
    'SHA-512'
  );

  return {
    bytesSalt,
    bytesFinal
  }
}

export async function comparePassword(password: string, salt: string, raw: string, iterations = 210_000) {
  const bytesPassword = await generatePassword(raw, salt, iterations);

  return timingSafeEqual(
    Buffer.from(password, 'hex'),
    bytesPassword.bytesFinal
  );
}
