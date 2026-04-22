/**
 * Envelope encryption for ID-Verifier connector secrets.
 *
 * AES-256-GCM with a key derived from `MASTER_SETTINGS_ENCRYPTION_KEY`
 * (shared with the master-settings backbone — same KMS root). Each ciphertext
 * stores its own random 12-byte IV and 16-byte auth tag, plus the key
 * version so we can rotate roots without rewriting history.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const KEY_VERSION = 1;

function rootKey(): Buffer {
  const raw = process.env.MASTER_SETTINGS_ENCRYPTION_KEY
           ?? process.env.ML_PIPELINE_ENCRYPTION_KEY
           ?? 'dev-only-fallback-key-rotate-before-prod';
  return createHash('sha256').update(raw).digest(); // 32 bytes
}

export interface EncryptedBundle {
  ciphertext: string; // base64
  iv: string;         // base64
  tag: string;        // base64
  keyVersion: number;
}

export function sealSecret(plaintext: string): EncryptedBundle {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, rootKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    keyVersion: KEY_VERSION,
  };
}

export function openSecret(b: EncryptedBundle): string {
  const decipher = createDecipheriv(ALGO, rootKey(), Buffer.from(b.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(b.tag, 'base64'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(b.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

/** Returns a stable fingerprint (first 8 hex of SHA-256) — safe to log. */
export function secretFingerprint(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex').slice(0, 8);
}
