/**
 * Envelope encryption for FD-16 bank-details vault. AES-256-GCM with the
 * shared `MASTER_SETTINGS_ENCRYPTION_KEY` root (rotated quarterly via the
 * super-admin two-person flow). Plaintext is NEVER persisted; we keep
 *   • ciphertext + iv + tag (per field)
 *   • account_last4 (display only)
 *   • fingerprint (sha256 prefix — duplicate-account detection)
 *   • key_version (so rotation can re-seal in place)
 *
 * Fingerprint uses a deterministic salt so two equal numbers collide
 * (used by the duplicate-account guard) but raw numbers don't leak via
 * a rainbow table.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
export const KEY_VERSION = 1;
const FP_SALT = 'gigvora.bank.v1';

function rootKey(): Buffer {
  const raw =
    process.env.MASTER_SETTINGS_ENCRYPTION_KEY ??
    process.env.FINANCE_VAULT_ENCRYPTION_KEY ??
    'dev-only-fallback-key-rotate-before-prod';
  return createHash('sha256').update(raw).digest();
}

export interface EncField { ciphertext: string; iv: string; tag: string }

export function sealField(plaintext: string): EncField {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, rootKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    ciphertext: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

export function openField(f: EncField): string {
  const decipher = createDecipheriv(ALGO, rootKey(), Buffer.from(f.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(f.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(f.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

export function fingerprintAccount(accountNumber: string): string {
  return createHash('sha256').update(`${FP_SALT}::${accountNumber}`).digest('hex').slice(0, 32);
}

export function last4(accountNumber: string): string {
  const digits = accountNumber.replace(/\D/g, '');
  return digits.slice(-4).padStart(4, '•');
}
