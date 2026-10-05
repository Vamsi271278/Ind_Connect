// @ts-check
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, it } from 'node:test';

import { checkArchitecture } from './check-architecture.mjs';

/** @type {string[]} */
const fixtures = [];

/**
 * Creates a minimal compliant repository, then applies `files` on top.
 * @param {Record<string, string>} [files] relative path -> content
 */
function fixtureRepo(files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'pc-arch-'));
  fixtures.push(root);
  /** @type {Record<string, string>} */
  const baseline = {
    'package.json': JSON.stringify({ name: 'root', packageManager: 'pnpm@12.8.2' }),
    'pnpm-workspace.yaml': "packages:\n  - 'apps/*'\n",
    'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
    'CLAUDE.md': '# governance\n',
    '.claude/settings.json': '{}',
    'apps/mobile/package.json': JSON.stringify({
      name: '@project-connect/mobile',
      dependencies: { expo: '57.0.26', 'react-dom': '19.2.3' },
    }),
    'apps/mobile/app.json': JSON.stringify({ expo: { platforms: ['ios', 'android'] } }),
    'apps/api/package.json': JSON.stringify({ name: '@project-connect/api' }),
  };
  for (const [rel, content] of Object.entries({ ...baseline, ...files })) {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return root;
}

/** @param {string} root */
const checksFailing = (root) => [...new Set(checkArchitecture(root).map((v) => v.check))];

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('check-architecture', () => {
  it('passes a compliant repository', () => {
    assert.deepEqual(checkArchitecture(fixtureRepo()), []);
  });

  it('passes the real repository', () => {
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    assert.deepEqual(checkArchitecture(repoRoot), []);
  });

  it('rejects nested workspace and lock files, and non-pnpm lockfiles', () => {
    const root = fixtureRepo({
      'apps/admin/pnpm-workspace.yaml': 'allowBuilds: {}\n',
      'apps/admin/pnpm-lock.yaml': '',
      'apps/api/package-lock.json': '{}',
    });
    const violations = checkArchitecture(root).filter((v) => v.check === 'single-workspace');
    assert.deepEqual(violations.map((v) => v.path).sort(), [
      'apps/admin/pnpm-lock.yaml',
      'apps/admin/pnpm-workspace.yaml',
      'apps/api/package-lock.json',
    ]);
  });

  it('rejects nested git repositories', () => {
    const root = fixtureRepo({ 'apps/mobile/.git/HEAD': 'ref: refs/heads/main\n' });
    assert.deepEqual(checksFailing(root), ['no-nested-git']);
  });

  it('rejects competing agent instruction files and nested Claude governance', () => {
    const root = fixtureRepo({
      'apps/admin/AGENTS.md': '# agents\n',
      'apps/api/CLAUDE.md': '# nested\n',
      'apps/mobile/.claude/settings.json': '{}',
      '.github/copilot-instructions.md': '# copilot\n',
    });
    const violations = checkArchitecture(root);
    assert.deepEqual(checksFailing(root), ['agent-governance']);
    assert.equal(violations.length, 4);
  });

  it('rejects packageManager outside the root manifest', () => {
    const root = fixtureRepo({
      'apps/admin/package.json': JSON.stringify({ name: 'admin', packageManager: 'pnpm@12.8.2' }),
    });
    assert.deepEqual(checksFailing(root), ['root-package-manager']);
  });

  /** @type {[string, string][]} */
  const forbiddenDependencies = [
    ['tailwindcss', 'Tailwind'],
    ['@tailwindcss/postcss', 'Tailwind scope'],
    ['@nestjs/mau', 'Mau'],
    ['oxlint', 'oxlint'],
    ['oxlint-tsgolint', 'oxlint type-aware'],
    ['iovalkey', 'Valkey client'],
    ['firebase', 'Firebase client SDK'],
    ['@react-native-firebase/firestore', 'Firestore'],
    ['mongoose', 'MongoDB'],
    ['@nestjs/graphql', 'GraphQL server'],
  ];
  for (const [dependency, label] of forbiddenDependencies) {
    it(`rejects forbidden dependency: ${label}`, () => {
      const root = fixtureRepo({
        'apps/api/package.json': JSON.stringify({ devDependencies: { [dependency]: '1.0.0' } }),
      });
      assert.deepEqual(checksFailing(root), ['forbidden-dependencies']);
    });
  }

  it('allows FCM push transport packages', () => {
    const root = fixtureRepo({
      'apps/api/package.json': JSON.stringify({ dependencies: { 'firebase-admin': '1.0.0' } }),
    });
    assert.deepEqual(checkArchitecture(root), []);
  });

  it('rejects Valkey images and engines but not prose mentioning Valkey', () => {
    const root = fixtureRepo({
      'compose.yaml': 'services:\n  cache:\n    image: valkey/valkey:8\n',
      'infrastructure/terraform/cache.tf': 'resource "x" "y" {\n  engine = "valkey"\n}\n',
      'compose.override.yaml': '# Redis OSS, not Valkey\nservices: {}\n',
    });
    const violations = checkArchitecture(root);
    assert.deepEqual(checksFailing(root), ['no-valkey-infrastructure']);
    assert.deepEqual(violations.map((v) => v.path).sort(), [
      'compose.yaml',
      'infrastructure/terraform/cache.tf',
    ]);
  });

  it('rejects Kubernetes manifests and Helm charts but not other YAML', () => {
    const root = fixtureRepo({
      'deploy/api.yaml': 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api\n',
      'charts/api/Chart.yaml': 'name: api\n',
      '.github/workflows/ci.yml': 'name: CI\non: push\n',
    });
    const violations = checkArchitecture(root);
    assert.deepEqual(checksFailing(root), ['no-kubernetes']);
    assert.equal(violations.length, 2);
  });

  it('rejects mobile web dependency and web app configuration', () => {
    const root = fixtureRepo({
      'apps/mobile/package.json': JSON.stringify({
        dependencies: { 'react-native-web': '0.21.0' },
      }),
      'apps/mobile/app.json': JSON.stringify({ expo: { platforms: ['ios', 'android', 'web'] } }),
    });
    const violations = checkArchitecture(root);
    assert.deepEqual(checksFailing(root), ['mobile-no-web']);
    assert.equal(violations.length, 2);
  });

  it('rejects client-to-backend and domain-to-infrastructure imports', () => {
    const root = fixtureRepo({
      'apps/mobile/src/a.ts': "import { x } from '@project-connect/api';\n",
      'apps/admin/src/b.ts': "import y from '../../../apps/api/src/y';\n",
      'apps/api/src/modules/connections/domain/c.ts':
        "import { Injectable } from '@nestjs/common';\nimport { Pool } from 'pg';\n",
      'apps/api/src/modules/connections/application/d.ts':
        "import { Injectable } from '@nestjs/common';\n",
    });
    const violations = checkArchitecture(root);
    assert.deepEqual(checksFailing(root), ['import-boundaries']);
    assert.equal(violations.length, 4);
  });

  it('rejects raw colour literals in app source, not in tokens, tests or prose', () => {
    const root = fixtureRepo({
      'apps/mobile/src/a.tsx': "const s = { color: '#4A47C2' };\n",
      'apps/mobile/src/b.tsx': 'const s = { color: "#fff" };\n',
      'apps/admin/src/c.tsx': "const s = { color: 'rgba(0, 0, 0, 0.5)' };\n",
      'apps/mobile/src/ok.tsx': 'const s = { color: colors.text.primary }; // see issue #123\n',
      'apps/mobile/src/ok.test.ts': "expect(x).toBe('#ffffff');\n",
      'packages/design-tokens/src/primitives.ts': "export const brand = '#4A47C2';\n",
    });
    const violations = checkArchitecture(root);
    assert.deepEqual(checksFailing(root), ['no-raw-colors']);
    assert.deepEqual(violations.map((v) => v.path).sort(), [
      'apps/admin/src/c.tsx',
      'apps/mobile/src/a.tsx',
      'apps/mobile/src/b.tsx',
    ]);
  });

  it('allows expo-crypto and expo-secure-store only in their D11 wrappers', () => {
    const root = fixtureRepo({
      'apps/mobile/src/platform/random.ts': "import { randomUUID } from 'expo-crypto';\n",
      'apps/mobile/src/platform/secure-store.ts': "import * as S from 'expo-secure-store';\n",
      'apps/mobile/src/core/x.ts': "import { randomUUID } from 'expo-crypto';\n",
      'apps/mobile/src/app/y.tsx': "import * as S from 'expo-secure-store';\n",
    });
    const violations = checkArchitecture(root);
    assert.deepEqual(checksFailing(root), ['platform-wrappers']);
    assert.deepEqual(violations.map((v) => v.path).sort(), [
      'apps/mobile/src/app/y.tsx',
      'apps/mobile/src/core/x.ts',
    ]);
  });
});
