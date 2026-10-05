import { generateKeyPairSync } from 'node:crypto';

import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';

import { ManualClock } from '../../../../../test/support/manual-clock.js';
import { JoseAccessTokenService } from './jose-access-token.service.js';

const USER = '0b5f7f4e-3c1d-4a8e-9f6b-1a2b3c4d5e6f';
const SESSION = '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b';

const make = (
  overrides: { issuer?: string; audience?: string } = {},
  clock = new ManualClock('2026-10-05T12:00:00Z'),
) => {
  const { privateKey } = generateKeyPairSync('ed25519');
  const service = new JoseAccessTokenService(
    {
      issuer: overrides.issuer ?? 'pc',
      audience: overrides.audience ?? 'pc-mobile',
      privateKey,
      keyId: 'k1',
      ttlSeconds: 900,
    },
    clock,
  );
  return { service, privateKey, clock };
};

describe('JoseAccessTokenService', () => {
  it('round-trips minimal claims with a 15-minute expiry', async () => {
    const { service, clock } = make();
    const { token, expiresAt } = await service.issue({ userId: USER, sessionId: SESSION });
    expect(expiresAt.getTime() - clock.now().getTime()).toBe(900_000);
    expect(await service.verify(token)).toEqual({ userId: USER, sessionId: SESSION });

    const [header, payload] = token.split('.');
    expect(JSON.parse(Buffer.from(header ?? '', 'base64url').toString())).toEqual({
      alg: 'EdDSA',
      kid: 'k1',
      typ: 'at+jwt',
    });
    expect(
      Object.keys(JSON.parse(Buffer.from(payload ?? '', 'base64url').toString()) as object).sort(),
    ).toEqual(['aud', 'exp', 'iat', 'iss', 'sid', 'sub']);
  });

  it('rejects expired, tampered, foreign-key and wrong-audience tokens', async () => {
    const { service, clock } = make();
    const { token } = await service.issue({ userId: USER, sessionId: SESSION });

    const [h, p] = token.split('.');
    expect(await service.verify(`${h ?? ''}.${p ?? ''}.${'A'.repeat(86)}`)).toBeUndefined();
    expect(await make().service.verify(token)).toBeUndefined();
    expect(await make({ audience: 'admin' }).service.verify(token)).toBeUndefined();
    expect(await service.verify('not-a-jwt')).toBeUndefined();

    clock.advance(900_000);
    expect(await service.verify(token)).toBeUndefined();
  });

  it('rejects unsigned and wrong-type tokens even with valid-looking claims', async () => {
    const { service, privateKey } = make();
    const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'at+jwt' })).toString('base64url')}.${Buffer.from(
      JSON.stringify({
        sub: USER,
        sid: SESSION,
        iss: 'pc',
        aud: 'pc-mobile',
        exp: 9_999_999_999,
        iat: 1,
      }),
    ).toString('base64url')}.`;
    expect(await service.verify(unsigned)).toBeUndefined();

    const wrongType = await new SignJWT({ sid: SESSION })
      .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
      .setSubject(USER)
      .setIssuer('pc')
      .setAudience('pc-mobile')
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(privateKey);
    expect(await service.verify(wrongType)).toBeUndefined();
  });
});
