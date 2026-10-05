import { generateKeyPairSync } from 'node:crypto';

// Test-only configuration. No real credentials: the key pair is generated per
// run, and infrastructure URLs default to an unreachable port so tests that do
// not provision PostgreSQL/Redis exercise the fail-closed paths.
const pem = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });

const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://pc_test:pc_test@127.0.0.1:1/pc_test',
  REDIS_URL: 'redis://127.0.0.1:1',
  OTP_PROVIDER: 'fake',
  OTP_FAKE_CODE: '246810',
  PHONE_HASH_PEPPER: 'test-only-pepper-not-a-secret-0123456789',
  PHONE_ALLOWED_COUNTRIES: '*',
  ACCESS_TOKEN_ISSUER: 'project-connect-test',
  ACCESS_TOKEN_AUDIENCE: 'project-connect-mobile-test',
  ACCESS_TOKEN_PRIVATE_KEY: Buffer.from(String(pem)).toString('base64'),
  ACCESS_TOKEN_KEY_ID: 'test-key',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}
