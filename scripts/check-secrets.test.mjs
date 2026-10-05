// @ts-check
// Secret-shaped fixtures are assembled at runtime so this file itself contains
// no secret-like literals and passes the scanner.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { checkSecrets, forbiddenPathRule, scanText } from './check-secrets.mjs';

/**
 * @param {string} prefix
 * @param {number} length
 * @param {string} [alphabet]
 */
const token = (prefix, length, alphabet = 'Ab3') =>
  prefix + alphabet.repeat(Math.ceil(length / alphabet.length)).slice(0, length);

/**
 * @param {string} relPath
 * @param {string} text
 */
const rulesFor = (relPath, text) => scanText(relPath, text).map((finding) => finding.rule);

describe('check-secrets', () => {
  it('passes the real repository', () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    assert.deepEqual(checkSecrets(repoRoot), []);
  });

  /** @type {[string, string][]} */
  const samples = [
    ['aws-access-key-id', `const id = '${token('AKIA', 16, 'ABCDEFGHIJKLMNOP')}';`],
    ['private-key-block', `${'-'.repeat(5)}BEGIN RSA PRIVATE KEY${'-'.repeat(5)}`],
    ['github-token', `token: ${token('ghp_', 36)}`],
    ['slack-token', `hook ${token('xoxb-', 24)}`],
    ['google-api-key', `key=${token('AIza', 35)}`],
    ['anthropic-api-key', `k = ${token('sk-ant-', 30)}`],
    ['jwt', `t = ${token('eyJ', 20)}.${token('eyJ', 20)}.${token('', 20)}`],
    ['bearer-token', `Authorization: Bearer ${token('', 40)}`],
  ];
  for (const [rule, sample] of samples) {
    it(`detects ${rule}`, () => {
      assert.ok(rulesFor('src/config.ts', sample).includes(rule));
    });
  }

  it('detects a quoted hard-coded secret in code', () => {
    const line = `const dbPassword = '${token('', 20, 'q7Z')}';`;
    assert.deepEqual(rulesFor('apps/api/src/db.ts', line), ['hardcoded-secret']);
  });

  it('detects an unquoted secret in configuration files', () => {
    const line = `API_SECRET: ${token('', 24, 'q7Z')}`;
    assert.deepEqual(rulesFor('compose.yaml', line), ['hardcoded-secret']);
  });

  it('ignores placeholders, env references and local-only values', () => {
    const text = [
      'POSTGRES_PASSWORD: local_project_connect_password',
      "const apiKey = process.env.API_KEY ?? '';",
      "password: 'your-password-here-please'",
      'REVENUECAT_WEBHOOK_SECRET=',
      'Authorization: Bearer <token>',
    ].join('\n');
    assert.deepEqual(scanText('compose.yaml', text), []);
    assert.deepEqual(scanText('apps/api/src/x.ts', text), []);
  });

  it('ignores non-secret metadata keys that share a secret-like prefix', () => {
    const text = [
      'ACCESS_TOKEN_AUDIENCE=project-connect-mobile',
      'ACCESS_TOKEN_ISSUER=project-connect-prod',
      'ACCESS_TOKEN_TTL_SECONDS=900000000000',
      'ACCESS_TOKEN_KEY_ID=prod-2026-10-05',
    ].join('\n');
    assert.deepEqual(scanText('.env.example', text), []);
  });

  it('still flags the secret itself next to that metadata', () => {
    const value = token('', 24, 'q7Z');
    assert.deepEqual(rulesFor('.env.example', `ACCESS_TOKEN_SECRET=${value}`), [
      'hardcoded-secret',
    ]);
    assert.deepEqual(rulesFor('.env.example', `ACCESS_TOKEN_PRIVATE_KEY=${value}`), [
      'hardcoded-secret',
    ]);
  });

  it('does not apply generic assignment matching to documentation', () => {
    const line = `password = '${token('', 20, 'q7Z')}'`;
    assert.deepEqual(rulesFor('docs/guide.md', line), []);
  });

  it('honours an explicit inline allow marker', () => {
    const line = `const id = '${token('AKIA', 16, 'ABCDEFGHIJKLMNOP')}'; // secret-scan: allow`;
    assert.deepEqual(scanText('src/x.ts', line), []);
  });

  it('reports line numbers and never the matched value', () => {
    const secretValue = token('ghp_', 36);
    const [finding] = scanText('a.ts', `ok\n${secretValue}`);
    assert.deepEqual(finding, { path: 'a.ts', line: 2, rule: 'github-token' });
    assert.ok(!JSON.stringify(finding).includes(secretValue));
  });

  it('flags environment and credential files by name without reading them', () => {
    assert.equal(forbiddenPathRule('.env'), 'environment-file');
    assert.equal(forbiddenPathRule('apps/admin/.env.local'), 'environment-file');
    assert.equal(forbiddenPathRule('apps/api/.env.production'), 'environment-file');
    assert.equal(forbiddenPathRule('certs/server.pem'), 'credential-file');
    assert.equal(forbiddenPathRule('apps/mobile/release.jks'), 'credential-file');
    assert.equal(forbiddenPathRule('.env.example'), undefined);
    assert.equal(forbiddenPathRule('src/environment.ts'), undefined);
  });
});
