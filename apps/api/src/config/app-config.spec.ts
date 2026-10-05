import { generateKeyPairSync } from 'node:crypto';
import { inspect } from 'node:util';

import { describe, expect, it } from 'vitest';

import { ConfigValidationError, loadConfig } from './app-config.js';
import { Secret } from './secret.js';

const pem = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
const PRIVATE_KEY = Buffer.from(String(pem)).toString('base64');
const PEPPER = 'pepper-value-that-is-long-enough-123456';
// Deliberately invalid key material, built at runtime so the file holds no
// secret-shaped literal.
const NOT_A_KEY = Buffer.from('not-a-key').toString('base64');

const validEnv = (): Record<string, string> => ({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://user:db-password-value@localhost:5432/pc',
  REDIS_URL: 'redis://localhost:6379',
  OTP_PROVIDER: 'fake',
  OTP_FAKE_CODE: '123456',
  PHONE_HASH_PEPPER: PEPPER,
  PHONE_ALLOWED_COUNTRIES: 'US,IN',
  ACCESS_TOKEN_ISSUER: 'pc-test',
  ACCESS_TOKEN_AUDIENCE: 'pc-mobile',
  ACCESS_TOKEN_PRIVATE_KEY: PRIVATE_KEY,
  ACCESS_TOKEN_KEY_ID: 'test-1',
});

const failure = (env: Record<string, string>): string => {
  try {
    loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigValidationError) return error.message;
    throw error;
  }
  throw new Error('expected configuration to be rejected');
};

describe('loadConfig', () => {
  it('parses a valid environment with approved policy defaults', () => {
    const config = loadConfig(validEnv());
    expect(config.otp).toMatchObject({
      codeTtlSeconds: 300,
      maxAttempts: 5,
      resendCooldownSeconds: 30,
      sendsPerPhonePerHour: 5,
      sendsPerPhonePerDay: 10,
      sendsPerIpPerHour: 20,
      sendsPerDevicePerHour: 10,
      verifiesPerIpPerHour: 30,
    });
    expect(config.tokens).toMatchObject({
      accessTtlSeconds: 900,
      refreshRollingDays: 30,
      familyMaxDays: 90,
      refreshGraceSeconds: 30,
    });
    expect(config.phone.countryPolicy).toEqual({
      mode: 'allowlist',
      countries: new Set(['US', 'IN']),
    });
    expect(loadConfig({ ...validEnv(), PHONE_ALLOWED_COUNTRIES: '*' }).phone.countryPolicy).toEqual(
      { mode: 'all' },
    );
  });

  it('refuses to start in production with the fake OTP provider', () => {
    expect(failure({ ...validEnv(), NODE_ENV: 'production' })).toContain('OTP_PROVIDER');
  });

  it('has no defaults for connection strings, keys or secrets', () => {
    for (const key of [
      'DATABASE_URL',
      'REDIS_URL',
      'PHONE_HASH_PEPPER',
      'ACCESS_TOKEN_PRIVATE_KEY',
      'PHONE_ALLOWED_COUNTRIES',
      'OTP_FAKE_CODE',
    ]) {
      const env = Object.fromEntries(Object.entries(validEnv()).filter(([name]) => name !== key));
      expect(failure(env)).toContain(key);
    }
  });

  it('rejects weak or malformed security inputs', () => {
    expect(failure({ ...validEnv(), PHONE_HASH_PEPPER: 'short' })).toContain('PHONE_HASH_PEPPER');
    expect(failure({ ...validEnv(), PHONE_ALLOWED_COUNTRIES: 'USA' })).toContain(
      'PHONE_ALLOWED_COUNTRIES',
    );
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({
      type: 'pkcs8',
      format: 'pem',
    });
    expect(
      failure({
        ...validEnv(),
        ACCESS_TOKEN_PRIVATE_KEY: Buffer.from(String(rsa)).toString('base64'),
      }),
    ).toContain('Ed25519');
    expect(failure({ ...validEnv(), SESSION_FAMILY_MAX_DAYS: '10' })).toContain(
      'SESSION_FAMILY_MAX_DAYS',
    );
  });

  it('never echoes secret values in validation errors', () => {
    const message = failure({
      ...validEnv(),
      PHONE_HASH_PEPPER: 'short',
      ACCESS_TOKEN_PRIVATE_KEY: NOT_A_KEY,
    });
    expect(message).not.toContain('short');
    expect(message).not.toContain(NOT_A_KEY);
  });

  it('keeps secrets out of serialization and inspection', () => {
    const config = loadConfig(validEnv());
    const rendered = [
      JSON.stringify(config),
      inspect(config, { depth: 10 }),
      String(config.phone.hashPepper),
    ].join('\n');
    expect(rendered).not.toContain(PEPPER);
    expect(rendered).not.toContain('db-password-value');
    expect(rendered).not.toContain('123456');
    expect(config.phone.hashPepper.reveal()).toBe(PEPPER);
    expect(new Secret('x').toJSON()).toBe('[REDACTED]');
  });
});
