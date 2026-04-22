/**
 * Envelope encryption for FD-17 secret-bearing settings (smtp/connectors/apiKeys).
 *
 * Pattern:
 *   - One symmetric KEK held in process env (`MASTER_SETTINGS_KEK_BASE64`),
 *     rotated quarterly via the kill-switch-protected /rotate flow.
 *   - Each row stores a fresh 32-byte DEK encrypted under KEK (AES-256-GCM).
 *   - Plaintext value is encrypted with the per-row DEK (AES-256-GCM).
 *   - Storage shape: { kekId, encDek, encValue, iv, tag, fingerprint, last4 }
 *   - Decryption only happens inside this service; callers receive a typed
 *     `SecretView` that exposes `fingerprint` + `last4` only by default.
 *
 * The fingerprint is `sha256(plaintext).slice(0,12)` so two equal secrets
 * collide deterministically (used by the duplicate-secret detector in
 * /admin/super/settings → secrets posture report).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export interface SecretEnvelope {
  kekId: string;
  encDekB64: string;
  encValueB64: string;
  ivB64: string;
  tagB64: string;
  fingerprint: string;
  last4: string;
}

export interface SecretView {
  fingerprint: string;
  last4: string;
}

const ALG = 'aes-256-gcm' as const;

function loadKek(): { id: string; key: Buffer } {
  const raw = process.env.MASTER_SETTINGS_KEK_BASE64;
  if (!raw) {
    // Deterministic dev KEK so local NestJS boot doesn't crash; never used in
    // production because settings.secrets.service refuses to write outside
    // production with this KEK ID.
    return { id: 'dev-kek', key: createHash('sha256').update('dev-only-kek').digest() };
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('MASTER_SETTINGS_KEK_BASE64 must decode to 32 bytes');
  return { id: process.env.MASTER_SETTINGS_KEK_ID ?? 'kek-1', key };
}

function aesGcmEncrypt(key: Buffer, plain: Buffer): { iv: Buffer; cipher: Buffer; tag: Buffer } {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  return { iv, cipher: enc, tag: cipher.getAuthTag() };
}

function aesGcmDecrypt(key: Buffer, iv: Buffer, cipher: Buffer, tag: Buffer): Buffer {
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cipher), decipher.final()]);
}

export function sealSecret(plaintext: string): SecretEnvelope {
  const kek = loadKek();
  const dek = randomBytes(32);
  const value = aesGcmEncrypt(dek, Buffer.from(plaintext, 'utf8'));
  const dekWrap = aesGcmEncrypt(kek.key, dek);
  // Wrap DEK with KEK; we need to keep the DEK's wrap iv+tag too. Pack as one buffer:
  const wrappedDek = Buffer.concat([dekWrap.iv, dekWrap.tag, dekWrap.cipher]);
  return {
    kekId: kek.id,
    encDekB64: wrappedDek.toString('base64'),
    encValueB64: value.cipher.toString('base64'),
    ivB64: value.iv.toString('base64'),
    tagB64: value.tag.toString('base64'),
    fingerprint: createHash('sha256').update(plaintext, 'utf8').digest('hex').slice(0, 12),
    last4: plaintext.slice(-4),
  };
}

export function openSecret(env: SecretEnvelope): string {
  const kek = loadKek();
  if (env.kekId !== kek.id) {
    throw new Error(`secret sealed under KEK ${env.kekId}, current is ${kek.id} — rotate before read`);
  }
  const wrapped = Buffer.from(env.encDekB64, 'base64');
  const iv = wrapped.subarray(0, 12);
  const tag = wrapped.subarray(12, 28);
  const cipher = wrapped.subarray(28);
  const dek = aesGcmDecrypt(kek.key, iv, cipher, tag);
  const plain = aesGcmDecrypt(
    dek,
    Buffer.from(env.ivB64, 'base64'),
    Buffer.from(env.encValueB64, 'base64'),
    Buffer.from(env.tagB64, 'base64'),
  );
  return plain.toString('utf8');
}

export function viewSecret(env: SecretEnvelope): SecretView {
  return { fingerprint: env.fingerprint, last4: env.last4 };
}
