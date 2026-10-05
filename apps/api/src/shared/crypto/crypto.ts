import { createHash, createHmac, randomBytes } from 'node:crypto';

import type { Secret } from '../../config/secret.js';

/** 32 random bytes, base64url without padding (43 characters). */
export const generateOpaqueToken = (): string => randomBytes(32).toString('base64url');

/** SHA-256 hex. Suitable for high-entropy values such as opaque tokens. */
export const sha256Hex = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');

/**
 * Keyed hashing for low-entropy identifiers (phone numbers, IPs, request
 * fingerprints), which a plain hash would not protect. Each purpose is domain-
 * separated so identifiers cannot be correlated across uses.
 */
export class KeyedHasher {
  constructor(private readonly pepper: Secret) {}

  hash(purpose: string, value: string): string {
    return createHmac('sha256', this.pepper.reveal())
      .update(`${purpose}\u0000${value}`, 'utf8')
      .digest('hex');
  }
}
