// @ts-check
// Local committed-secret guard for obvious accidents. Not an enterprise
// scanner: GitHub secret scanning / push protection remains the primary control
// (Phase 1 decision D7).
//
// Scans repository-controlled files only (tracked + untracked-but-not-ignored),
// so git-ignored local files such as real .env files are never opened. Findings
// report path, line and rule only, never the matched value.
//
// A line can opt out with an inline `secret-scan: allow` comment, which must be
// justified in review.
//
// Usage: node scripts/check-secrets.mjs   (exit 0 = pass, 1 = likely secret)

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { baseName } from './lib/repo-files.mjs';

/** @typedef {{ path: string, line: number, rule: string }} Finding */
/** @typedef {{ id: string, pattern: RegExp, appliesTo?: (relPath: string) => boolean }} Rule */

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const SKIPPED_FILES = new Set(['pnpm-lock.yaml']);

const BINARY_EXTENSIONS =
  /\.(?:png|jpe?g|gif|webp|ico|icns|bmp|tiff?|ttf|otf|woff2?|eot|mp3|mp4|mov|wav|pdf|zip|gz|tgz|7z|jar|hbc)$/i;

/** Key and credential containers that must never be committed, whatever their content. */
const CREDENTIAL_FILE = /\.(?:pem|key|p12|pfx|jks|keystore|p8|mobileprovision)$/i;

const CONFIG_FILE =
  /(?:\.(?:ya?ml|toml|ini|properties|tf|tfvars|conf|cfg)|(?:^|\/)\.env\.example)$/i;

const PLACEHOLDER_VALUE =
  /example|placeholder|change[_-]?me|dummy|sample|fake|redacted|your[_-]|xxx|local|test|\$\{|<|process\.env|import\.meta/i;

const SECRET_KEY_NAME =
  /(?<key>[\w.-]*(?:password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)[\w.-]*)/i
    .source;

// Metadata that merely shares a secret-like prefix (ACCESS_TOKEN_AUDIENCE,
// ACCESS_TOKEN_TTL_SECONDS, PRIVATE_KEY_ID, …) is not itself a secret.
const NON_SECRET_KEY_SUFFIX =
  /(?:issuer|audience|ttl\w*|key[_-]?id|header|algorithm|type|name|expires?\w*)$/i;

/** @type {Rule[]} */
export const RULES = [
  { id: 'aws-access-key-id', pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  {
    id: 'aws-secret-access-key',
    pattern: /aws_?secret_?access_?key["']?\s*[:=]\s*["']?[A-Za-z0-9/+=]{40}\b/i,
  },
  {
    id: 'private-key-block',
    pattern: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/,
  },
  {
    id: 'github-token',
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/,
  },
  { id: 'slack-token', pattern: /\bxox[abposr]-[A-Za-z0-9-]{10,}/ },
  { id: 'stripe-live-key', pattern: /\b[rs]k_live_[A-Za-z0-9]{20,}/ },
  { id: 'google-api-key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'twilio-api-key', pattern: /\bSK[0-9a-f]{32}\b/ },
  { id: 'anthropic-api-key', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { id: 'openai-api-key', pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/ },
  {
    id: 'jwt',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
  { id: 'bearer-token', pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{24,}=*/ },
  {
    // Code: a secret-like name assigned a quoted literal.
    id: 'hardcoded-secret',
    pattern: new RegExp(`${SECRET_KEY_NAME}["']?\\s*[:=]\\s*["'](?<value>[^"'\\s]{12,})["']`, 'i'),
    appliesTo: (relPath) => !relPath.endsWith('.md') && !CONFIG_FILE.test(relPath),
  },
  {
    // Configuration: quoted or unquoted values.
    id: 'hardcoded-secret',
    pattern: new RegExp(`${SECRET_KEY_NAME}["']?\\s*[:=]\\s*["']?(?<value>[^"'\\s#]{12,})`, 'i'),
    appliesTo: (relPath) => CONFIG_FILE.test(relPath),
  },
];

/**
 * Classifies a path that must never be committed regardless of content.
 * Such files are reported by name and never read.
 *
 * @param {string} relPath repository-relative POSIX path
 * @returns {string | undefined} rule id, if forbidden
 */
export function forbiddenPathRule(relPath) {
  const name = baseName(relPath);
  if (/^\.env(?:\..+)?$/.test(name) && name !== '.env.example') return 'environment-file';
  if (CREDENTIAL_FILE.test(name)) return 'credential-file';
  return undefined;
}

/**
 * @param {string} relPath
 * @param {string} text
 * @returns {Finding[]}
 */
export function scanText(relPath, text) {
  /** @type {Finding[]} */
  const findings = [];
  const rules = RULES.filter((rule) => !rule.appliesTo || rule.appliesTo(relPath));

  text.split(/\r?\n/).forEach((line, index) => {
    if (line.includes('secret-scan: allow')) return;
    for (const rule of rules) {
      const match = rule.pattern.exec(line);
      if (!match) continue;
      const key = match.groups?.key;
      const value = match.groups?.value;
      if (key !== undefined && NON_SECRET_KEY_SUFFIX.test(key)) continue;
      if (value !== undefined && PLACEHOLDER_VALUE.test(value)) continue;
      findings.push({ path: relPath, line: index + 1, rule: rule.id });
    }
  });

  return findings;
}

/**
 * @param {string} root absolute repository root
 * @returns {string[]} repository-relative POSIX paths
 */
export function listRepositoryFiles(root) {
  const output = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return [...new Set(output.split('\0').filter((entry) => entry !== ''))];
}

/**
 * @param {string} root absolute repository root
 * @returns {Finding[]}
 */
export function checkSecrets(root) {
  /** @type {Finding[]} */
  const findings = [];

  for (const relPath of listRepositoryFiles(root)) {
    const forbidden = forbiddenPathRule(relPath);
    if (forbidden) {
      findings.push({ path: relPath, line: 0, rule: forbidden });
      continue;
    }
    if (SKIPPED_FILES.has(baseName(relPath)) || BINARY_EXTENSIONS.test(relPath)) continue;

    const abs = path.join(root, relPath);
    let size;
    try {
      size = statSync(abs).size;
    } catch {
      continue; // tracked but deleted in the working tree
    }
    if (size > MAX_FILE_BYTES) continue;

    const text = readFileSync(abs, 'utf8');
    if (text.includes('\0')) continue; // binary
    findings.push(...scanText(relPath, text));
  }

  return findings;
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const findings = checkSecrets(root);

  if (findings.length === 0) {
    console.log('Secret scan passed.');
    return;
  }

  console.error(
    `Secret scan failed: ${String(findings.length)} finding(s). Values are not printed.\n`,
  );
  for (const finding of findings) {
    const location = finding.line > 0 ? `${finding.path}:${String(finding.line)}` : finding.path;
    console.error(`  [${finding.rule}] ${location}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
