// Prints a fresh Ed25519 signing key for LOCAL development, in the format the
// API config expects. Paste the output into apps/api/.env (git-ignored).
// Never commit the output. Non-local environments get keys from Secrets Manager.
//
// Usage (from apps/api): pnpm keys:generate

import { generateKeyPairSync } from 'node:crypto';

const pem = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'pem' });
const keyId = `local-${new Date().toISOString().slice(0, 10)}`;

process.stdout.write(
  `ACCESS_TOKEN_PRIVATE_KEY=${Buffer.from(String(pem)).toString('base64')}\nACCESS_TOKEN_KEY_ID=${keyId}\n`,
);
