import { createPublicKey, type KeyObject } from 'node:crypto';

import { jwtVerify, SignJWT } from 'jose';

import type { AccessTokenClaims, AccessTokenService, Clock } from '../../application/ports.js';

const ALGORITHM = 'EdDSA';
const TOKEN_TYPE = 'at+jwt';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AccessTokenSettings {
  readonly issuer: string;
  readonly audience: string;
  readonly privateKey: KeyObject;
  readonly keyId: string;
  readonly ttlSeconds: number;
}

/**
 * Ed25519-signed JWT access tokens (P4). Minimal claims: subject (user) and
 * session ID. Identity only — authorization state is always re-read from the
 * database, never trusted from the token.
 */
export class JoseAccessTokenService implements AccessTokenService {
  private readonly publicKey: KeyObject;

  constructor(
    private readonly settings: AccessTokenSettings,
    private readonly clock: Clock,
  ) {
    this.publicKey = createPublicKey(settings.privateKey);
  }

  async issue(claims: AccessTokenClaims): Promise<{ token: string; expiresAt: Date }> {
    const issuedAt = Math.floor(this.clock.now().getTime() / 1000);
    const expiresAtSeconds = issuedAt + this.settings.ttlSeconds;
    const token = await new SignJWT({ sid: claims.sessionId })
      .setProtectedHeader({ alg: ALGORITHM, kid: this.settings.keyId, typ: TOKEN_TYPE })
      .setSubject(claims.userId)
      .setIssuer(this.settings.issuer)
      .setAudience(this.settings.audience)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAtSeconds)
      .sign(this.settings.privateKey);
    return { token, expiresAt: new Date(expiresAtSeconds * 1000) };
  }

  async verify(token: string): Promise<AccessTokenClaims | undefined> {
    try {
      const { payload } = await jwtVerify(token, this.publicKey, {
        algorithms: [ALGORITHM],
        issuer: this.settings.issuer,
        audience: this.settings.audience,
        typ: TOKEN_TYPE,
        currentDate: this.clock.now(),
        requiredClaims: ['sub', 'sid', 'exp', 'iat'],
      });
      const sessionId: unknown = payload.sid;
      if (
        typeof payload.sub !== 'string' ||
        !UUID.test(payload.sub) ||
        typeof sessionId !== 'string' ||
        !UUID.test(sessionId)
      ) {
        return undefined;
      }
      return { userId: payload.sub, sessionId };
    } catch {
      return undefined;
    }
  }
}
