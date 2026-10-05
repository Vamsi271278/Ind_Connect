// @ts-check
// Repository architecture guard (CI layer; ESLint is the editor-time layer).
//
// Deterministic structural checks for decisions recorded in CLAUDE.md and
// docs/architecture/PHASE-1-DECISIONS.md. Pure Node.js, no dependencies.
// Never reads environment files.
//
// Usage: node scripts/check-architecture.mjs   (exit 0 = pass, 1 = violation)

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { baseName, walkRepository } from './lib/repo-files.mjs';

/** @typedef {{ check: string, path: string, message: string }} Violation */
/** @typedef {{ path: string, manifest: Record<string, unknown> }} PackageManifest */
/**
 * @typedef {object} Repository
 * @property {string} root
 * @property {string[]} files
 * @property {string[]} dirs
 * @property {PackageManifest[]} manifests
 * @property {(relPath: string) => string} read
 */

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/**
 * Forbidden direct dependencies. An entry ending in '/' matches a whole scope.
 * @type {{ names: string[], reason: string }[]}
 */
const FORBIDDEN_DEPENDENCIES = [
  {
    names: ['tailwindcss', '@tailwindcss/', 'nativewind'],
    reason: 'Tailwind is not approved; UI uses packages/design-tokens (CLAUDE.md §24).',
  },
  {
    names: ['@nestjs/mau'],
    reason: 'Mau deployment bypasses Terraform/ECS deployment authority (A4).',
  },
  {
    names: ['oxlint', 'oxlint-tsgolint', 'eslint-plugin-oxlint'],
    reason: 'Repository lint standard is ESLint; a second lint stack is not approved (A4).',
  },
  {
    names: ['iovalkey', 'valkey-glide', '@valkey/'],
    reason: 'Redis OSS is approved; Valkey requires an ADR (D3/G2).',
  },
  {
    // FCM through PushProvider is approved (firebase-admin, @react-native-firebase/messaging).
    names: [
      'firebase',
      'firebase-functions',
      '@firebase/firestore',
      '@firebase/database',
      '@google-cloud/firestore',
      '@react-native-firebase/firestore',
      '@react-native-firebase/database',
    ],
    reason: 'Firebase as primary backend/database is not approved (CLAUDE.md §6).',
  },
  {
    names: [
      'mongodb',
      'mongoose',
      '@nestjs/mongoose',
      '@typegoose/typegoose',
      '@mikro-orm/mongodb',
    ],
    reason: 'MongoDB as a core datastore is not approved (CLAUDE.md §6).',
  },
  {
    names: [
      'graphql',
      '@nestjs/graphql',
      '@nestjs/apollo',
      '@nestjs/mercurius',
      '@apollo/server',
      'apollo-server',
      'apollo-server-express',
      'graphql-yoga',
      'mercurius',
      'type-graphql',
      'express-graphql',
      'graphql-http',
    ],
    reason: 'GraphQL is not approved for V1; REST + OpenAPI is canonical (CLAUDE.md §6).',
  },
];

const AGENT_INSTRUCTION_FILES = new Set([
  'agents.md',
  'gemini.md',
  '.cursorrules',
  '.windsurfrules',
  'copilot-instructions.md',
]);

const K8S_FILE_NAMES = new Set([
  'chart.yaml',
  'kustomization.yaml',
  'kustomization.yml',
  'helmfile.yaml',
  'helmfile.yml',
]);

const K8S_KIND =
  /^kind:\s*(?:Deployment|StatefulSet|DaemonSet|ReplicaSet|Pod|Service|Ingress|ConfigMap|Secret|Job|CronJob|Namespace|HorizontalPodAutoscaler|PersistentVolumeClaim)\s*$/m;

const IMPORT_SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|^\s*import\s+)['"]([^'"]+)['"]/gm;

const SOURCE_FILE = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;

/** App and shared-UI source (excluding tests/fixtures) that must use design tokens. */
const APP_UI_SOURCE = /^(?:apps\/[^/]+|packages\/ui)\/src\//;
const TEST_OR_FIXTURE = /(?:\.(?:test|spec|e2e-spec|int-spec)\.[cm]?[jt]sx?$|\/__fixtures__\/)/;

/** A colour literal inside a string: '#abc', "#aabbcc", `#aabbccdd`, 'rgb(', 'hsl('. */
const RAW_COLOR =
  /['"`](?:#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})['"`]|(?:rgba?|hsla?)\s*\()/;

/**
 * Platform modules that may each be imported from exactly one wrapper (D11).
 * @type {Record<string, string>}
 */
const SINGLE_IMPORT_WRAPPERS = {
  'expo-crypto': 'apps/mobile/src/platform/random.ts',
  'expo-secure-store': 'apps/mobile/src/platform/secure-store.ts',
};

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {PackageManifest} pkg
 * @returns {string[]}
 */
function directDependencyNames(pkg) {
  return DEPENDENCY_FIELDS.flatMap((field) => {
    const deps = pkg.manifest[field];
    return isRecord(deps) ? Object.keys(deps) : [];
  });
}

/**
 * @param {string} dependency
 * @param {string} pattern
 */
function matchesDependency(dependency, pattern) {
  return pattern.endsWith('/') ? dependency.startsWith(pattern) : dependency === pattern;
}

/**
 * @param {string} relPath
 * @param {string} text
 * @returns {string[]}
 */
function importSpecifiers(relPath, text) {
  if (!SOURCE_FILE.test(relPath)) return [];
  return Array.from(text.matchAll(IMPORT_SPECIFIER), (match) => match[1] ?? '');
}

/** @type {Record<string, (repo: Repository) => Violation[]>} */
export const CHECKS = {
  'single-workspace': (repo) => {
    /** @type {Violation[]} */
    const violations = [];
    for (const name of ['pnpm-workspace.yaml', 'pnpm-lock.yaml']) {
      const found = repo.files.filter((file) => baseName(file) === name);
      for (const file of found.filter((f) => f !== name)) {
        violations.push({
          check: 'single-workspace',
          path: file,
          message: `Nested ${name}: the repository root is the only pnpm workspace authority.`,
        });
      }
      if (!found.includes(name)) {
        violations.push({
          check: 'single-workspace',
          path: name,
          message: `Root ${name} is missing.`,
        });
      }
    }
    for (const file of repo.files) {
      if (['package-lock.json', 'yarn.lock', 'bun.lockb', 'bun.lock'].includes(baseName(file))) {
        violations.push({
          check: 'single-workspace',
          path: file,
          message: 'Only pnpm-lock.yaml is permitted (pnpm workspaces).',
        });
      }
    }
    return violations;
  },

  'no-nested-git': (repo) =>
    [...repo.dirs, ...repo.files]
      .filter((entry) => baseName(entry) === '.git' && entry !== '.git')
      .map((entry) => ({
        check: 'no-nested-git',
        path: entry,
        message: 'Nested Git repository/worktree is not permitted.',
      })),

  'agent-governance': (repo) => {
    /** @type {Violation[]} */
    const violations = [];
    for (const file of repo.files) {
      const name = baseName(file).toLowerCase();
      if (AGENT_INSTRUCTION_FILES.has(name)) {
        violations.push({
          check: 'agent-governance',
          path: file,
          message:
            'Agent instructions are governed only by CLAUDE.md / .claude/ / approved docs (A2-2).',
        });
      }
      if (name === 'claude.md' && file !== 'CLAUDE.md') {
        violations.push({
          check: 'agent-governance',
          path: file,
          message: 'Only the root CLAUDE.md is permitted.',
        });
      }
    }
    for (const dir of repo.dirs) {
      if (baseName(dir) === '.claude' && dir !== '.claude') {
        violations.push({
          check: 'agent-governance',
          path: dir,
          message: 'Only the root .claude/ directory is permitted.',
        });
      }
    }
    return violations;
  },

  'root-package-manager': (repo) =>
    repo.manifests
      .filter((pkg) => pkg.path !== 'package.json' && 'packageManager' in pkg.manifest)
      .map((pkg) => ({
        check: 'root-package-manager',
        path: pkg.path,
        message: 'packageManager is owned by the root package.json only.',
      })),

  'forbidden-dependencies': (repo) => {
    /** @type {Violation[]} */
    const violations = [];
    for (const pkg of repo.manifests) {
      for (const dependency of directDependencyNames(pkg)) {
        for (const rule of FORBIDDEN_DEPENDENCIES) {
          if (rule.names.some((pattern) => matchesDependency(dependency, pattern))) {
            violations.push({
              check: 'forbidden-dependencies',
              path: pkg.path,
              message: `${dependency}: ${rule.reason}`,
            });
          }
        }
      }
    }
    return violations;
  },

  'no-valkey-infrastructure': (repo) =>
    repo.files
      .filter((file) => /\.(?:ya?ml|tf|tfvars)$/.test(file))
      .filter((file) => {
        const text = repo.read(file);
        return /^\s*image:\s*\S*valkey/im.test(text) || /\bengine\s*=\s*"valkey"/i.test(text);
      })
      .map((file) => ({
        check: 'no-valkey-infrastructure',
        path: file,
        message: 'Redis OSS is approved; Valkey requires an ADR (D3/G2).',
      })),

  'no-kubernetes': (repo) =>
    repo.files
      .filter((file) => {
        if (K8S_FILE_NAMES.has(baseName(file).toLowerCase())) return true;
        if (!/\.ya?ml$/.test(file)) return false;
        const text = repo.read(file);
        return /^apiVersion:\s*\S+/m.test(text) && K8S_KIND.test(text);
      })
      .map((file) => ({
        check: 'no-kubernetes',
        path: file,
        message: 'Kubernetes/EKS is not approved; runtime is ECS Fargate (CLAUDE.md §6).',
      })),

  'mobile-no-web': (repo) => {
    /** @type {Violation[]} */
    const violations = [];
    const mobile = repo.manifests.find((pkg) => pkg.path === 'apps/mobile/package.json');
    if (mobile && directDependencyNames(mobile).includes('react-native-web')) {
      violations.push({
        check: 'mobile-no-web',
        path: mobile.path,
        message: 'react-native-web: web is not a V1 mobile platform (A4).',
      });
    }
    if (repo.files.includes('apps/mobile/app.json')) {
      /** @type {unknown} */
      const appJson = JSON.parse(repo.read('apps/mobile/app.json'));
      const expo = isRecord(appJson) ? appJson.expo : undefined;
      const platforms = isRecord(expo) ? expo.platforms : undefined;
      if (
        isRecord(expo) &&
        ('web' in expo || (Array.isArray(platforms) && platforms.includes('web')))
      ) {
        violations.push({
          check: 'mobile-no-web',
          path: 'apps/mobile/app.json',
          message: 'Web app configuration is not approved for V1 mobile (A4).',
        });
      }
    }
    return violations;
  },

  'import-boundaries': (repo) => {
    /** @type {Violation[]} */
    const violations = [];
    for (const file of repo.files) {
      const isClientApp = /^apps\/(?:mobile|admin)\//.test(file);
      const isDomain = /^apps\/api\/src\/modules\/[^/]+\/domain\//.test(file);
      if (!isClientApp && !isDomain) continue;

      for (const specifier of importSpecifiers(file, repo.read(file))) {
        if (
          isClientApp &&
          (/^@project-connect\/(?:api|worker)(?:\/|$)/.test(specifier) ||
            /(?:^|\/)apps\/(?:api|worker)(?:\/|$)/.test(specifier))
        ) {
          violations.push({
            check: 'import-boundaries',
            path: file,
            message: `Client applications must not import backend applications (${specifier}).`,
          });
        }
        if (
          isDomain &&
          /^(?:@nestjs\/|drizzle-orm(?:\/|$)|pg(?:\/|$)|redis(?:\/|$)|@aws-sdk\/)/.test(specifier)
        ) {
          violations.push({
            check: 'import-boundaries',
            path: file,
            message: `Domain layer must not depend on frameworks/ORM/infrastructure (${specifier}).`,
          });
        }
      }
    }
    return violations;
  },

  'no-raw-colors': (repo) =>
    repo.files
      .filter((file) => APP_UI_SOURCE.test(file) && SOURCE_FILE.test(file))
      .filter((file) => !TEST_OR_FIXTURE.test(file))
      .filter((file) => RAW_COLOR.test(repo.read(file)))
      .map((file) => ({
        check: 'no-raw-colors',
        path: file,
        message:
          'Raw colour literal in app/UI source: use @project-connect/design-tokens semantic roles (CLAUDE.md §24).',
      })),

  'platform-wrappers': (repo) => {
    /** @type {Violation[]} */
    const violations = [];
    for (const file of repo.files) {
      if (!file.startsWith('apps/')) continue;
      for (const specifier of importSpecifiers(file, repo.read(file))) {
        const wrapper = SINGLE_IMPORT_WRAPPERS[specifier];
        if (wrapper !== undefined && file !== wrapper) {
          violations.push({
            check: 'platform-wrappers',
            path: file,
            message: `${specifier} may only be imported by ${wrapper} (D11 narrow wrapper).`,
          });
        }
      }
    }
    return violations;
  },
};

/**
 * @param {string} root absolute repository root
 * @returns {Repository}
 */
export function loadRepository(root) {
  const { files, dirs } = walkRepository(root);
  /** @param {string} relPath */
  const read = (relPath) => readFileSync(path.join(root, relPath), 'utf8');
  const manifests = files
    .filter((file) => baseName(file) === 'package.json')
    .map((file) => {
      /** @type {unknown} */
      const manifest = JSON.parse(read(file));
      return { path: file, manifest: isRecord(manifest) ? manifest : {} };
    });
  return { root, files, dirs, manifests, read };
}

/**
 * @param {string} root absolute repository root
 * @returns {Violation[]}
 */
export function checkArchitecture(root) {
  const repo = loadRepository(root);
  return Object.values(CHECKS).flatMap((check) => check(repo));
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const violations = checkArchitecture(root);

  if (violations.length === 0) {
    console.log(`Architecture checks passed (${String(Object.keys(CHECKS).length)} checks).`);
    return;
  }

  console.error(`Architecture check failed: ${String(violations.length)} violation(s).\n`);
  for (const violation of violations) {
    console.error(`  [${violation.check}] ${violation.path}\n    ${violation.message}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
