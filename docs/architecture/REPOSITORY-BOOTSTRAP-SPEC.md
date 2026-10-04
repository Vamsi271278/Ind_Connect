# PROJECT CONNECT — CLAUDE CODE REPOSITORY BOOTSTRAP SPECIFICATION

## Document Version
**1.0**

## Date Baseline
**October 4, 2026**

## Product
**Project Connect**

## Purpose

This document is the literal engineering bootstrap manual for creating Project Connect from an empty development machine and empty repository.

It defines:

- workstation requirements;
- Windows/WSL setup;
- Node/pnpm versions;
- Claude Code installation;
- Git configuration;
- monorepo creation;
- folder structure;
- package boundaries;
- TypeScript;
- linting;
- formatting;
- testing;
- Expo mobile;
- NestJS API;
- Next.js admin;
- worker;
- PostgreSQL/PostGIS;
- Redis;
- Docker Compose;
- local environment;
- configuration management;
- `CLAUDE.md`;
- Claude rules;
- Claude skills;
- Claude subagents;
- Claude permissions;
- Claude hooks;
- architecture guard scripts;
- GitHub Actions;
- CODEOWNERS;
- pull-request standards;
- security scanning;
- Terraform skeleton;
- initial seed data;
- Definition of Ready;
- first clean green build.

The purpose is to make Claude Code capable of working at high speed **inside controlled engineering boundaries**.

---

# 1. BOOTSTRAP PHILOSOPHY

We will not begin by generating application screens.

We will first establish:

```text
Reproducible Toolchain
        ↓
Repository Governance
        ↓
Architecture Enforcement
        ↓
Testing
        ↓
Security Controls
        ↓
Local Infrastructure
        ↓
Application Skeletons
        ↓
CI
        ↓
Claude Code Operating Environment
        ↓
First Vertical Slice
```

A green repository with no product features is more valuable than hundreds of generated screens sitting on unstable engineering foundations.

---

# 2. PRIMARY DEVELOPMENT ENVIRONMENT

The recommended primary developer environment for Windows is:

```text
Windows 11
+
WSL2
+
Ubuntu LTS
+
VS Code / preferred IDE
+
Docker Desktop with WSL integration
+
Claude Code inside WSL
```

Claude Code supports Windows through WSL and also supports native Windows with Git Bash, but Project Connect should standardize on WSL2 for consistent Linux-like tooling.

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](SPEC-RECONCILIATION.md) R-11, R-12:** native Windows development is supported and the existing repository location is retained; WSL2 is recommended but optional (this also relaxes §6). All Claude hooks and repository scripts must be cross-platform (Node), not Bash-only. The default branch is `main`.

---

# 3. MACOS REQUIREMENT

A Mac is not required for every developer.

EAS can perform cloud builds.

However:

- iOS Simulator requires macOS;
- local Xcode debugging requires macOS;
- certain final iOS-specific diagnostics may require a Mac.

The team should eventually have at least one Mac available for iOS QA.

---

# 4. HARDWARE RECOMMENDATION

Minimum practical developer machine:

```text
16 GB RAM
4+ CPU cores
50+ GB free SSD
```

Preferred:

```text
32 GB RAM
8+ logical cores
100+ GB free SSD
```

This is materially more comfortable once Docker, Android emulator, IDE, API, database, Redis, and Claude Code run simultaneously.

---

# 5. WINDOWS — INSTALL WSL2

Open PowerShell as Administrator:

```powershell
wsl --install
```

Restart if requested.

Verify:

```powershell
wsl --status
```

Install Ubuntu if not already installed:

```powershell
wsl --install -d Ubuntu
```

Launch Ubuntu and create the Linux user account.

---

# 6. WSL DEVELOPMENT LOCATION

Keep the repository inside the Linux filesystem.

Good:

```text
~/workspace/project-connect
```

Avoid:

```text
/mnt/c/Users/...
```

for the primary repository because filesystem performance and permission semantics are typically less predictable for Node-heavy workloads.

---

# 7. UPDATE UBUNTU

Inside WSL:

```bash
sudo apt update
sudo apt upgrade -y
```

Install baseline packages:

```bash
sudo apt install -y \
  build-essential \
  curl \
  git \
  unzip \
  jq \
  ca-certificates \
  gnupg \
  lsb-release
```

---

# 8. GIT CONFIGURATION

Configure identity:

```bash
git config --global user.name "YOUR NAME"
git config --global user.email "YOUR_EMAIL"
```

Configure useful defaults:

```bash
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global fetch.prune true
```

Verify:

```bash
git config --global --list
```

---

# 9. NODE VERSION STRATEGY

## Decision

Use:

**Node.js 24 LTS**

for Project Connect bootstrap.

Current Node releases show Node 24 as LTS while Node 26 remains Current as of October 4, 2026.

We do not use Current releases for production foundation merely because they are newer.

---

# 10. INSTALL NVM

Inside WSL:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash
```

Reload shell:

```bash
source ~/.bashrc
```

Verify:

```bash
nvm --version
```

---

# 11. INSTALL NODE 24

```bash
nvm install 24
nvm alias default 24
nvm use 24
```

Verify:

```bash
node --version
npm --version
```

---

# 12. REPOSITORY NODE PIN

Root file:

```text
.nvmrc
```

Contents:

```text
24
```

Also define in `package.json`:

```json
{
  "engines": {
    "node": ">=24 <25"
  }
}
```

This prevents silent runtime drift.

---

# 13. PNPM

pnpm 12 is the current pnpm release line, and its official installer documents support for current Node environments.

Install:

```bash
npm install -g pnpm@12
```

Verify:

```bash
pnpm --version
```

---

# 14. PNPM PINNING

After repository creation:

```bash
pnpm --version
```

Suppose result is:

```text
12.x.y
```

Pin the exact version in root `package.json`:

```json
{
  "packageManager": "pnpm@12.x.y"
}
```

Use the **actual installed stable version**, not this placeholder.

---

# 15. DOCKER

Install Docker Desktop in Windows.

Enable:

```text
Settings
→ Resources
→ WSL Integration
→ Ubuntu
```

Inside WSL verify:

```bash
docker version
docker compose version
```

Both client and server should respond.

---

# 16. CLAUDE CODE INSTALLATION

Anthropic currently supports standard installation with the Claude Code npm package and recommends running `claude doctor` after installation.

Install:

```bash
npm install -g @anthropic-ai/claude-code
```

Do not use:

```bash
sudo npm install -g ...
```

Verify:

```bash
claude --version
claude doctor
```

Launch once:

```bash
claude
```

Complete authentication.

Exit after successful authentication.

---

# 17. CLAUDE CODE UPDATE POLICY

Claude Code should remain current because Anthropic ships frequent tooling/security improvements.

Check periodically:

```bash
claude update
```

Before major repository-wide automation, verify:

```bash
claude doctor
```

---

# 18. NEVER USE DANGEROUS BYPASS MODE

Project Connect prohibits routine use of:

```bash
claude --dangerously-skip-permissions
```

Claude Code exposes this option, but it bypasses permission prompts and is inappropriate for this repository's normal workflow.

---

# 19. CREATE WORKSPACE

```bash
mkdir -p ~/workspace
cd ~/workspace
mkdir project-connect
cd project-connect
```

Initialize Git:

```bash
git init
```

---

# 20. INITIAL ROOT DIRECTORIES

Create:

```bash
mkdir -p \
  apps \
  packages \
  docs/product \
  docs/architecture/adr \
  docs/safety \
  docs/design \
  docs/analytics \
  docs/operations \
  infrastructure/terraform \
  scripts \
  .claude/agents \
  .claude/rules \
  .claude/skills \
  .claude/hooks \
  .github/workflows
```

> **Amended 2026-10-04:** `.github/pull_request_template.md` is a file (see §21, §100), not a directory; the directory entry was removed from this command.

---

# 21. ROOT DIRECTORY TARGET

```text
project-connect/
│
├── apps/
│   ├── mobile/
│   ├── api/
│   ├── worker/
│   └── admin/
│
├── packages/
│   ├── api-client/
│   ├── api-contracts/
│   ├── analytics/
│   ├── config/
│   ├── design-tokens/
│   ├── domain-types/
│   ├── observability/
│   ├── testing/
│   ├── ui/
│   └── validation/
│
├── docs/
│   ├── product/
│   ├── architecture/
│   │   └── adr/
│   ├── safety/
│   ├── design/
│   ├── analytics/
│   └── operations/
│
├── infrastructure/
│   └── terraform/
│
├── scripts/
│
├── .claude/
│   ├── agents/
│   ├── hooks/
│   ├── rules/
│   ├── skills/
│   └── settings.json
│
├── .github/
│   ├── workflows/
│   ├── CODEOWNERS
│   └── pull_request_template.md
│
├── CLAUDE.md
├── docker-compose.yml
├── eslint.config.mjs
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prettier.config.mjs
├── tsconfig.base.json
├── turbo.json
└── README.md
```

---

# 22. ROOT PACKAGE.JSON

Initialize:

```bash
pnpm init
```

Replace root `package.json` with this baseline:

```json
{
  "name": "project-connect",
  "version": "0.0.0",
  "private": true,
  "description": "Project Connect monorepo",
  "packageManager": "pnpm@12.x.y",
  "engines": {
    "node": ">=24 <25"
  },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:integration": "turbo run test:integration",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test",
    "infra:up": "docker compose up -d",
    "infra:down": "docker compose down",
    "infra:logs": "docker compose logs -f",
    "db:migrate": "pnpm --filter @project-connect/api db:migrate",
    "db:seed": "pnpm --filter @project-connect/api db:seed",
    "architecture:check": "node scripts/check-architecture.mjs",
    "security:secrets": "node scripts/check-secrets.mjs"
  },
  "devDependencies": {}
}
```

Replace `12.x.y` with the pinned installed pnpm version.

---

# 23. PNPM WORKSPACE

Create:

```text
pnpm-workspace.yaml
```

Contents:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

# 24. TURBOREPO

Install:

```bash
pnpm add -Dw turbo
```

Create:

```text
turbo.json
```

Contents:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:unit": {
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "cache": false
    }
  }
}
```

---

# 25. ROOT TYPESCRIPT

Install:

```bash
pnpm add -Dw typescript @types/node
```

Create:

```text
tsconfig.base.json
```

Contents:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "moduleResolution": "Bundler"
  }
}
```

---

# 26. WHY THESE STRICT FLAGS

Particularly important:

```text
strict
noUncheckedIndexedAccess
exactOptionalPropertyTypes
useUnknownInCatchVariables
```

These catch a substantial class of AI-generated assumptions before runtime.

---

# 27. PRETTIER

Install:

```bash
pnpm add -Dw prettier
```

Create:

```text
prettier.config.mjs
```

```javascript
/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
};
```

Create:

```text
.prettierignore
```

```text
node_modules
dist
coverage
.next
.expo
terraform.tfstate
terraform.tfstate.*
pnpm-lock.yaml
```

---

# 28. ESLINT

Install baseline:

```bash
pnpm add -Dw \
  eslint \
  @eslint/js \
  typescript-eslint \
  eslint-plugin-import-x \
  eslint-plugin-unicorn
```

Create:

```text
eslint.config.mjs
```

Initial structure:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import unicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.expo/**',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.strictTypeChecked,

  {
    plugins: {
      'import-x': importX,
      unicorn,
    },

    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      'unicorn/prefer-node-protocol': 'error',

      'import-x/no-cycle': 'error'
    }
  }
);
```

During actual bootstrap, adjust parser project configuration per package rather than weakening strict rules globally.

---

# 29. GITIGNORE

Create:

```text
.gitignore
```

```text
# dependencies
node_modules/

# local env
.env
.env.local
.env.*.local

# allow safe template
!.env.example

# build
dist/
build/
.next/
.expo/
coverage/

# system
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json

# terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl

# certificates / keys
*.pem
*.key
*.p12
*.pfx

# Claude local settings
.claude/settings.local.json

# test output
test-results/
playwright-report/

# logs
*.log
```

---

# 30. EDITORCONFIG

Create:

```text
.editorconfig
```

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

---

# 31. MOBILE APPLICATION

Create temporary scaffold outside workspace:

```bash
cd /tmp
npx create-expo-app@latest project-connect-mobile
```

Use the current stable default template.

Expo's current reference recommends Expo Router for Expo projects, and current stable SDK documentation places Expo SDK 57 on React Native 0.86.

Move scaffold:

```bash
rm -rf ~/workspace/project-connect/apps/mobile
mv /tmp/project-connect-mobile ~/workspace/project-connect/apps/mobile
```

Return:

```bash
cd ~/workspace/project-connect
```

---

# 32. MOBILE PACKAGE NAME

Update:

```json
{
  "name": "@project-connect/mobile",
  "private": true
}
```

Do not let the mobile application publish to npm.

---

# 33. MOBILE ROUTING

Keep Expo Router standard stable stack/tabs.

Do not use experimental navigation APIs in production merely because they exist. Expo explicitly labels Experimental Stack as testing-only.

Initial:

```text
apps/mobile/app/
├── _layout.tsx
├── (auth)/
│   ├── _layout.tsx
│   ├── welcome.tsx
│   └── phone.tsx
│
└── (app)/
    ├── _layout.tsx
    ├── discover/
    ├── events/
    ├── connections/
    ├── messages/
    └── profile/
```

---

# 34. MOBILE SOURCE

Use:

```text
apps/mobile/src/
├── features/
├── components/
├── hooks/
├── services/
├── providers/
├── config/
├── analytics/
└── testing/
```

Routes should remain thin.

---

# 35. MOBILE CORE DEPENDENCIES

Install deliberately:

```bash
pnpm --filter @project-connect/mobile add \
  @tanstack/react-query \
  zustand \
  zod \
  react-hook-form \
  @hookform/resolvers
```

Expo packages should generally be installed using:

```bash
npx expo install <package>
```

from `apps/mobile`, ensuring Expo-compatible versions.

---

# 36. MOBILE SECURE STORAGE

Inside mobile app:

```bash
cd apps/mobile
npx expo install expo-secure-store
cd ../..
```

Authentication tokens must not use AsyncStorage.

---

# 37. MOBILE NOTIFICATIONS

Later when implementing notification foundation:

```bash
cd apps/mobile
npx expo install expo-notifications
cd ../..
```

Do not request notification permission in bootstrap screen.

---

# 38. API APPLICATION — NESTJS

Install Nest CLI as a temporary generator through npx rather than relying on global version:

```bash
cd /tmp
npx @nestjs/cli@latest new project-connect-api \
  --package-manager pnpm \
  --skip-git
```

Move:

```bash
rm -rf ~/workspace/project-connect/apps/api
mv /tmp/project-connect-api ~/workspace/project-connect/apps/api
```

Rename package:

```json
{
  "name": "@project-connect/api",
  "private": true
}
```

---

# 39. API TARGET STRUCTURE

Refactor toward:

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── identity/
│   ├── profile/
│   ├── discovery/
│   ├── connections/
│   ├── messaging/
│   ├── events/
│   ├── trust-safety/
│   ├── notifications/
│   ├── billing/
│   ├── media/
│   ├── configuration/
│   ├── audit/
│   └── admin/
│
├── shared/
│   ├── database/
│   ├── auth/
│   ├── observability/
│   └── http/
│
└── bootstrap/
```

---

# 40. DOMAIN MODULE FORMAT

Example:

```text
modules/connections/
├── domain/
│   ├── entities/
│   ├── policies/
│   ├── repositories/
│   └── errors/
│
├── application/
│   ├── commands/
│   ├── queries/
│   └── services/
│
├── infrastructure/
│   ├── persistence/
│   └── messaging/
│
└── api/
    ├── controllers/
    ├── dto/
    └── mappers/
```

---

# 41. WORKER APPLICATION

Create:

```bash
mkdir -p apps/worker/src
```

`apps/worker/package.json`:

```json
{
  "name": "@project-connect/worker",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "test": "vitest run"
  }
}
```

The worker initially hosts queue consumers without creating microservices.

---

# 42. ADMIN APPLICATION

Create:

```bash
cd /tmp
npx create-next-app@latest project-connect-admin \
  --typescript \
  --eslint \
  --app \
  --src-dir \
  --use-pnpm
```

Move:

```bash
rm -rf ~/workspace/project-connect/apps/admin
mv /tmp/project-connect-admin ~/workspace/project-connect/apps/admin
```

Set:

```json
{
  "name": "@project-connect/admin",
  "private": true
}
```

---

# 43. SHARED PACKAGE CREATION

Create:

```bash
for pkg in \
  api-client \
  api-contracts \
  analytics \
  config \
  design-tokens \
  domain-types \
  observability \
  testing \
  ui \
  validation
do
  mkdir -p "packages/$pkg/src"
done
```

---

# 44. SHARED PACKAGE TEMPLATE

Example:

```text
packages/domain-types/package.json
```

```json
{
  "name": "@project-connect/domain-types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

Create comparable package metadata for the other shared packages.

---

# 45. SHARED PACKAGE RULE

Do not place domain behavior into `domain-types`.

It contains:

- stable codes;
- shared safe interfaces;
- public enums where appropriate.

Business rules remain backend domain logic.

---

# 46. VALIDATION PACKAGE

`packages/validation` may contain genuinely shared schemas such as:

- phone formatting;
- safe field constraints;
- API DTO helper schemas.

Do not place server-only authorization rules there.

---

# 47. DESIGN TOKENS PACKAGE

Initial structure:

```text
packages/design-tokens/src/
├── color.ts
├── spacing.ts
├── radius.ts
├── typography.ts
├── motion.ts
└── index.ts
```

No raw feature colors outside approved token package.

---

# 48. UI PACKAGE

Mobile-first shared components:

```text
packages/ui/src/
├── Button/
├── TextField/
├── Chip/
├── Avatar/
├── VerificationBadge/
├── PersonCard/
├── EventCard/
├── EmptyState/
├── InlineError/
└── index.ts
```

Do not immediately overbuild all 50 components.

Build components as required by first vertical slice.

---

# 49. DATABASE LIBRARIES

Install in API:

```bash
pnpm --filter @project-connect/api add \
  drizzle-orm \
  pg \
  zod
```

Development:

```bash
pnpm --filter @project-connect/api add -D \
  drizzle-kit \
  @types/pg
```

---

# 50. DATABASE DIRECTORY

```text
apps/api/src/shared/database/
├── schema/
├── migrations/
├── db.ts
└── database.module.ts
```

Do not create a gigantic single `schema.ts`.

---

# 51. LOCAL POSTGRES + POSTGIS

Create:

```text
docker-compose.yml
```

```yaml
services:
  postgres:
    image: postgis/postgis:17-3.5
    container_name: project-connect-postgres
    environment:
      POSTGRES_DB: project_connect
      POSTGRES_USER: project_connect
      POSTGRES_PASSWORD: local_project_connect_password
    ports:
      - "5432:5432"
    volumes:
      - project_connect_postgres:/var/lib/postgresql/data
    healthcheck:
      test:
        ["CMD-SHELL", "pg_isready -U project_connect -d project_connect"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:8-alpine
    container_name: project-connect-redis
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - project_connect_redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  project_connect_postgres:
  project_connect_redis:
```

Pin image versions to approved exact patch versions once repository bootstrap is validated.

---

# 52. LOCAL PASSWORD WARNING

The password in Docker Compose is **local-development only**.

It is:

- not production;
- not reused;
- not a secret.

Production credentials go to AWS Secrets Manager.

---

# 53. START INFRASTRUCTURE

```bash
pnpm infra:up
```

Verify:

```bash
docker compose ps
```

Expected:

```text
postgres healthy
redis healthy
```

---

# 54. DATABASE CONNECTION

Local API environment:

```text
DATABASE_URL=postgresql://project_connect:local_project_connect_password@localhost:5432/project_connect
REDIS_URL=redis://localhost:6379
```

---

# 55. ENVIRONMENT FILE STRATEGY

Root:

```text
.env.example
```

Never commit actual `.env`.

---

# 56. ENV EXAMPLE

```dotenv
NODE_ENV=development

API_PORT=3000

DATABASE_URL=postgresql://project_connect:local_project_connect_password@localhost:5432/project_connect
REDIS_URL=redis://localhost:6379

JWT_ISSUER=project-connect-local
JWT_AUDIENCE=project-connect-mobile

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=

REVENUECAT_WEBHOOK_SECRET=

SENTRY_DSN=
POSTHOG_KEY=

AWS_REGION=
AWS_S3_PROFILE_MEDIA_BUCKET=
```

No real keys.

---

# 57. CONFIG PACKAGE

All backend environment values must be parsed at startup.

Use Zod.

Conceptual:

```typescript
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
});
```

Application should fail early if required config is missing.

---

# 58. TEST FRAMEWORK

Recommended:

```text
Vitest
```

for shared packages and domain tests.

Nest integration can also use Vitest rather than maintaining two overlapping test ecosystems where possible.

Install:

```bash
pnpm add -Dw vitest @vitest/coverage-v8
```

---

# 59. TEST DIRECTORY POLICY

Prefer colocated unit tests:

```text
connection-policy.ts
connection-policy.test.ts
```

Integration tests:

```text
apps/api/test/integration/
```

E2E:

```text
apps/mobile/e2e/
```

---

# 60. INTEGRATION TEST DATABASE

Integration tests must use real PostgreSQL/PostGIS.

Never replace with SQLite.

Use:

- Docker Compose test database;
- or Testcontainers if later approved.

---

# 61. TEST SCRIPTS

Each package should expose relevant:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run --exclude '**/*.integration.test.ts'",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

---

# 62. MOBILE E2E

Do not install Maestro immediately unless first mobile shell is functioning.

When ready:

```text
apps/mobile/e2e/
```

Critical first flow:

```text
launch
→ onboarding shell
→ auth mocked/sandboxed
→ discovery shell
```

Later extend to full vertical slice.

---

# 63. API DOCUMENTATION

Install Swagger/OpenAPI Nest packages when API foundation begins.

Target endpoint:

```text
/docs
```

Staging/dev only by default.

Production API docs should be restricted or disabled unless needed.

---

# 64. OPENAPI GENERATED CLIENT

`packages/api-client` will eventually be generated from approved API schema.

Never hand-edit generated files.

Expected flow:

```text
API OpenAPI
↓
Client Generation
↓
packages/api-client
↓
Mobile/Admin
```

---

# 65. ROOT CLAUDE.MD

Anthropic recommends root `CLAUDE.md` for persistent build commands, architecture, repository layout, and team conventions. Long procedural workflows should live elsewhere to avoid wasting context.

Create:

```text
CLAUDE.md
```

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](SPEC-RECONCILIATION.md) R-01, R-02:** the repository's actual root `CLAUDE.md` is the authoritative always-on file and supersedes the illustrative content below. It incorporates the specificity rule (R-00) and the stricter approval policy (R-01). The content below is retained as the original bootstrap draft.

Use this content:

```markdown
# Project Connect — Claude Code Repository Instructions

## Mission

Project Connect is an 18+ verified Indian-diaspora connection platform for friendship, activities, events, professional networking, and explicitly opt-in dating.

The repository must prioritize:

1. user safety
2. security
3. privacy
4. data integrity
5. authorization correctness
6. approved product behavior
7. accessibility
8. reliability
9. maintainability
10. performance

Do not optimize development speed by weakening any higher-priority item.

---

## Source of truth

Before implementing non-trivial behavior, inspect the relevant files under:

- `docs/product/`
- `docs/architecture/`
- `docs/safety/`
- `docs/design/`
- `docs/analytics/`
- `docs/operations/`

Architecture Decision Records under `docs/architecture/adr/` are binding unless superseded.

Never invent product policy when the docs already define it.

---

## Frozen architecture

V1 uses:

- React Native + Expo
- Expo Router
- TypeScript strict mode
- TanStack Query
- Zustand only for limited local UI state
- NestJS modular monolith
- REST + OpenAPI
- PostgreSQL + PostGIS
- Redis for ephemeral state
- SQS + transactional outbox
- WebSocket/Socket.IO for realtime delivery
- AWS ECS Fargate
- RDS
- ElastiCache
- S3 + CloudFront
- Twilio Verify
- RevenueCat
- PostHog
- Sentry
- Next.js admin
- Terraform
- GitHub Actions
- EAS

Do not replace or introduce architectural technologies without an ADR.

Explicitly do not introduce V1:

- microservices
- Kubernetes
- GraphQL
- Kafka
- MongoDB
- Firebase as primary backend/database
- Elasticsearch/OpenSearch
- event sourcing
- heavy CQRS
- ML recommender
- background GPS tracking

---

## Repository structure

- `apps/mobile` — React Native/Expo consumer application
- `apps/api` — NestJS modular monolith
- `apps/worker` — async job consumers
- `apps/admin` — Next.js staff console
- `packages/*` — approved shared libraries
- `infrastructure/terraform` — infrastructure as code
- `docs` — approved product/architecture/policy documents

Applications must not import internals from other applications.

Use shared packages for intentional contracts only.

---

## Backend dependency direction

API -> Application -> Domain

Infrastructure implements ports used by Application/Domain.

Domain code must not depend on:

- NestJS
- ORM
- AWS SDK
- Redis
- HTTP
- provider SDKs

Controllers must remain thin and must not call ORM directly.

One domain must not directly mutate another domain's tables.

---

## TypeScript

- `strict: true`
- no `any` without explicit documented justification
- no routine `@ts-ignore`
- use `unknown` at unsafe boundaries
- validate external input at runtime with Zod
- prefer discriminated unions for stateful domain results

---

## API rules

- REST under `/api/v1`
- OpenAPI is mandatory
- actor identity comes from authenticated session, never client body
- resource IDs always receive object-level authorization checks
- never expose ORM entities
- public profile DTOs must never expose:
  - date of birth
  - phone
  - email
  - exact coordinates
  - moderation history
  - report history
  - sensitive dating preferences
- cursor pagination for unbounded collections
- idempotency for retry-sensitive mutations

---

## Safety and privacy rules

Never weaken these:

- 18+ only
- no stranger direct messaging
- dating requires explicit consent
- block acts immediately
- report remains available to free users
- reporter identity is confidential
- exact location never goes to consumer clients
- premium never overrides block/safety/privacy
- verification does not mean "safe"
- moderators receive only scoped evidence

When safety and convenience conflict, safety wins.

---

## Data rules

- PostgreSQL is the system of record
- Redis is never the sole source of truth for core domain state
- all schema changes require migrations
- destructive changes use expand-contract
- preserve DB constraints
- exact user coordinates stay server-side
- no continuous location history by default
- never use real production PII in development/staging

---

## Mobile rules

- routes/screens orchestrate; do not contain domain logic
- server state belongs in TanStack Query
- Zustand is local/transient UI state only
- use generated/centralized API client
- tokens use SecureStore
- use design-system tokens/components
- no raw HEX values in feature components
- accessibility is required
- permission prompts must be contextual

---

## Async/realtime

For durable user actions:

Validate -> Persist -> Commit -> Publish -> Deliver

Do not deliver first and hope persistence succeeds.

Critical async integrations use transactional outbox.

SQS consumers must be idempotent.

Push/analytics failures must not roll back committed business state.

---

## External providers

All vendor SDKs sit behind interfaces such as:

- `PhoneVerificationProvider`
- `SubscriptionProvider`
- `PushProvider`
- `IdentityVerificationProvider`
- `AnalyticsProvider`
- `MediaModerationProvider`

Do not spread provider objects across domain code.

---

## Dependencies

Do not add dependencies casually.

Before adding a production dependency, verify:

- existing code/platform cannot solve it cleanly
- maintenance health
- security
- license
- bundle/runtime impact
- architectural fit

Auth, crypto, payments, database, native and security packages require human approval.

---

## Testing

Every business-critical feature requires behavior-focused tests.

Mandatory categories include:

- authorization
- block precedence
- dating eligibility
- subscription entitlement
- connection state transitions
- event capacity
- IDOR
- retry/idempotency where relevant

Integration tests use real PostgreSQL/PostGIS.

Do not weaken tests to make implementation pass.

---

## Definition of Done

A feature is not complete merely because it compiles.

Required where relevant:

- functional behavior
- server validation
- authorization
- privacy
- safety behavior
- loading/empty/error states
- accessibility
- analytics
- observability
- tests
- documentation
- migration plan
- OpenAPI contract

---

## Working style

For non-trivial work:

1. inspect relevant docs/code
2. state affected modules and rules
3. produce a concise plan
4. implement the smallest coherent vertical change
5. run formatter/lint/typecheck/tests
6. inspect the final diff
7. report what was verified and anything not verified

Never claim tests/builds passed unless they were actually run.

---

## Human approval required

Do not execute autonomously:

- package installation
- production-impacting database migrations
- Terraform apply
- cloud mutations
- production deployments
- secret access
- production data access
- destructive repository operations
- protected branch push
- architecture replacement

Never use `--dangerously-skip-permissions`.

---

## Architecture change

If the approved architecture blocks a requirement, do not silently deviate.

Produce:

- problem
- evidence
- affected ADR
- options
- recommendation
- migration impact
- proposed replacement ADR
```

This root file is intentionally concise relative to the complete Engineering Constitution.

---

# 66. WHY CLAUDE.MD IS NOT 250 PAGES

Anthropic's current guidance is particularly important here: root `CLAUDE.md` remains in the context throughout sessions, so every unnecessary line creates persistent context cost. Path-specific rules and skills exist specifically to avoid stuffing every instruction into the root file.

Therefore:

```text
Facts Claude always needs
→ CLAUDE.md

Scoped technical rules
→ .claude/rules/

Procedures
→ .claude/skills/

Specialists
→ .claude/agents/

Deterministic enforcement
→ hooks + CI
```

---

# 67. CLAUDE RULES

Anthropic currently supports `.claude/rules/` with optional `paths:` frontmatter so instructions load only when matching files are being worked on.

Create the following files.

---

# 68. RULE — API

```text
.claude/rules/api.md
```

```markdown
---
paths:
  - "apps/api/src/**/*.ts"
  - "packages/api-contracts/**/*.ts"
---

# API Rules

- Controllers remain thin.
- Controllers cannot import database/ORM modules directly.
- Validate external requests.
- Authenticate protected endpoints.
- Perform resource-level authorization.
- Actor identity must come from authenticated context.
- Return explicit DTOs.
- Never expose ORM entities.
- Update OpenAPI contracts for externally visible API changes.
- Use stable domain error codes.
- Use cursor pagination for unbounded lists.
- Retry-sensitive mutations need idempotency.
```

---

# 69. RULE — DATABASE

```text
.claude/rules/database.md
```

```markdown
---
paths:
  - "apps/api/src/shared/database/**"
  - "apps/api/**/infrastructure/persistence/**"
  - "**/migrations/**"
---

# Database Rules

- PostgreSQL/PostGIS is canonical.
- Every schema change requires a migration.
- Preserve foreign keys and unique constraints.
- Never remove constraints merely to satisfy code/tests.
- Destructive changes require expand-contract.
- Parameterize raw SQL.
- Review query plans for performance-sensitive paths.
- Never expose exact location from persistence DTOs.
- Do not create continuous location-history tables without approved requirement.
```

---

# 70. RULE — MOBILE

```text
.claude/rules/mobile.md
```

```markdown
---
paths:
  - "apps/mobile/**"
  - "packages/ui/**"
  - "packages/design-tokens/**"
---

# Mobile Rules

- Use Expo Router.
- Screens orchestrate; business logic belongs outside routes.
- TanStack Query owns server state.
- Zustand is for limited transient/local UI state.
- Use centralized/generated API client.
- Authentication secrets use SecureStore.
- Use semantic design tokens.
- No feature-level raw colors.
- No new icon library without approval.
- Every interactive control requires accessibility semantics.
- Handle loading, error and empty states.
- Do not request OS permissions without contextual explanation.
```

---

# 71. RULE — SAFETY

```text
.claude/rules/safety.md
```

```markdown
---
paths:
  - "apps/api/src/modules/trust-safety/**"
  - "apps/api/src/modules/messaging/**"
  - "apps/api/src/modules/connections/**"
  - "apps/api/src/modules/profile/**"
  - "apps/admin/src/**"
---

# Trust & Safety Rules

- Block has system-wide precedence.
- Stranger messaging is prohibited.
- Dating consent must remain explicit.
- Reporter identity is confidential.
- Safety tools are never premium-only.
- Moderators may access only scoped evidence.
- Do not implement automated permanent bans from weak model scores.
- Never expose precise location.
- Do not add global user search.
- Any safety behavior change must trace to an approved specification.
```

---

# 72. RULE — ANALYTICS

```text
.claude/rules/analytics.md
```

```markdown
---
paths:
  - "packages/analytics/**"
  - "apps/**/analytics/**"
---

# Analytics Rules

Never send:
- names
- phone
- email
- DOB
- exact coordinates
- private message content
- report text
- moderator notes
- authentication tokens

Critical business outcome events should originate from backend state where possible.

Analytics failure may never block a primary user operation.
```

---

# 73. RULE — INFRASTRUCTURE

```text
.claude/rules/infrastructure.md
```

```markdown
---
paths:
  - "infrastructure/**"
  - ".github/workflows/**"
---

# Infrastructure Rules

- AWS is the approved cloud.
- Infrastructure is Terraform-managed.
- ECS Fargate is approved compute.
- Production database and Redis remain private.
- Use least-privilege IAM.
- No wildcard IAM without explicit documented requirement.
- No Kubernetes.
- No manual production mutation as normal workflow.
- Secrets belong in Secrets Manager, never Terraform literals.
- Production apply requires human approval.
```

---

# 74. CLAUDE SKILLS

Anthropic's current skill model uses directories containing `SKILL.md` with `name` and `description` frontmatter. Project-level skills live under `.claude/skills/`.

Create:

```text
.claude/skills/
├── implement-feature/
├── fix-bug/
├── review-security/
├── review-architecture/
├── create-migration/
├── review-accessibility/
└── prepare-pr/
```

---

# 75. SKILL — IMPLEMENT FEATURE

```text
.claude/skills/implement-feature/SKILL.md
```

```markdown
---
name: implement-feature
description: Implement a Project Connect feature from an approved requirement. Use for non-trivial product features that span business logic, API, data, mobile/admin UI, analytics, or tests.
---

# Implement Feature

1. Identify the requirement IDs and source documents.
2. Inspect existing module architecture.
3. List affected domains.
4. Identify authorization, privacy, safety and analytics implications.
5. Determine whether schema/API changes are necessary.
6. Produce a concise implementation plan before editing.
7. Implement domain behavior first.
8. Implement persistence/infrastructure adapters.
9. Implement API contracts/controllers.
10. Implement client behavior.
11. Add analytics/observability.
12. Add positive and adversarial tests.
13. Run targeted tests, then lint and typecheck.
14. Inspect the final git diff.
15. Report:
   - implemented behavior
   - tests run
   - relevant ADRs
   - risks or unverified items

Do not expand product scope beyond the requirement.
```

---

# 76. SKILL — FIX BUG

```text
.claude/skills/fix-bug/SKILL.md
```

```markdown
---
name: fix-bug
description: Diagnose and fix a Project Connect defect using reproduction, root-cause analysis and regression testing. Use when existing behavior is incorrect or failing.
---

# Fix Bug

1. Reproduce or establish the failure from evidence.
2. Identify root cause before editing.
3. Identify safety/security/data-integrity impact.
4. Add or identify a failing regression test when practical.
5. Make the smallest correct fix.
6. Avoid unrelated refactoring.
7. Run regression and adjacent tests.
8. Review the diff.
9. State root cause and exactly what verifies the fix.
```

---

# 77. SKILL — SECURITY REVIEW

```text
.claude/skills/review-security/SKILL.md
```

```markdown
---
name: review-security
description: Perform a read-oriented security review of a Project Connect change or diff. Use for auth, authorization, PII, admin, billing, upload, webhook, safety, and high-risk backend changes.
---

# Security Review

Evaluate:

- authentication
- object-level authorization / IDOR
- role/attribute authorization
- block/safety precedence
- mass assignment
- input validation
- injection
- file handling
- secrets
- token handling
- PII exposure
- location exposure
- rate limiting
- webhook authenticity
- idempotency
- logging leakage
- concurrency/race conditions

Return findings ordered:

CRITICAL
HIGH
MEDIUM
LOW

For each finding provide:
- location
- risk
- exploit/failure scenario
- remediation

Do not edit files unless explicitly asked.
```

---

# 78. SKILL — ARCHITECTURE REVIEW

```text
.claude/skills/review-architecture/SKILL.md
```

```markdown
---
name: review-architecture
description: Check a Project Connect change against the approved architecture and ADRs. Use for cross-domain changes, new dependencies, refactors, infrastructure, or architectural concerns.
---

# Architecture Review

Check:

- ADR compliance
- module boundaries
- dependency direction
- provider abstraction
- controller/database separation
- domain framework independence
- server/client boundaries
- asynchronous side effects
- transaction boundaries
- architecture drift
- unnecessary technology additions

Do not approve an architecture deviation merely because it works.
```

---

# 79. SKILL — MIGRATION

```text
.claude/skills/create-migration/SKILL.md
```

```markdown
---
name: create-migration
description: Design and review a safe Project Connect PostgreSQL schema migration. Use whenever changing database schema, constraints, indexes, or data backfills.
---

# Create Migration

Before creating migration state:

- purpose
- affected tables
- expected row count/scale
- compatibility impact
- locking risk
- backfill need
- deployment sequence
- recovery strategy

Use expand-contract for destructive/breaking changes.

Preserve constraints.

Do not execute production migrations.
```

---

# 80. SKILL — ACCESSIBILITY REVIEW

```text
.claude/skills/review-accessibility/SKILL.md
```

```markdown
---
name: review-accessibility
description: Review Project Connect mobile/admin UI for accessibility and design-system compliance. Use for new or changed user-facing interfaces.
---

# Accessibility Review

Review:

- labels
- roles
- state announcement
- touch target
- text scaling
- focus order
- contrast semantics
- error presentation
- non-color status
- keyboard handling
- screen-reader behavior

Also check approved design tokens/components.
```

---

# 81. SKILL — PREPARE PR

```text
.claude/skills/prepare-pr/SKILL.md
```

```markdown
---
name: prepare-pr
description: Perform final Project Connect change validation and prepare a pull request summary. Use after implementation before opening a PR.
---

# Prepare PR

1. Inspect `git status`.
2. Inspect complete diff.
3. Check for unintended files.
4. Run relevant tests.
5. Run lint.
6. Run typecheck.
7. Run architecture check.
8. Run secret check.
9. Summarize requirement and behavior.
10. Document security/privacy effects.
11. Document migrations.
12. Document tests.
13. Identify any unverified risk.

Never claim a check passed unless it was executed successfully.
```

---

# 82. CLAUDE SUBAGENTS

Anthropic's current Claude Code design uses Markdown agent files in `.claude/agents/` with YAML frontmatter. Subagents execute in isolated contexts, making them appropriate for independent review and focused specialist work.

Create:

```text
.claude/agents/
├── architect.md
├── backend-engineer.md
├── mobile-engineer.md
├── database-engineer.md
├── security-reviewer.md
├── trust-safety-reviewer.md
├── qa-engineer.md
├── ux-accessibility-reviewer.md
└── devops-engineer.md
```

---

# 83. AGENT — ARCHITECT

```markdown
---
name: architect
description: Reviews Project Connect architecture and ADR compliance. Use for cross-domain plans, major refactors, dependencies, infrastructure, and architecture decisions.
tools: Read, Grep, Glob
---

You are the Project Connect architecture reviewer.

Your default posture is read-only.

Review against:
- CLAUDE.md
- docs/architecture/
- ADRs

Focus on:
- modular-monolith boundaries
- dependency direction
- unnecessary coupling
- transaction boundaries
- async seams
- provider abstraction
- architecture drift
- unnecessary complexity

Do not recommend fashionable technology without measured need.

Return:
1. architecture assessment
2. violations
3. risks
4. recommended correction
5. ADRs involved
```

---

# 84. AGENT — SECURITY REVIEWER

```markdown
---
name: security-reviewer
description: Performs adversarial security review for Project Connect. Use after changes involving authentication, authorization, user data, billing, uploads, webhooks, admin or trust and safety.
tools: Read, Grep, Glob
---

Act as an adversarial security reviewer.

Assume hostile clients can call backend APIs directly.

Check:
- authentication
- IDOR
- authorization
- privilege escalation
- stale authorization
- mass assignment
- rate limits
- injection
- sensitive data exposure
- secrets
- logging
- concurrency
- webhook forgery
- entitlement spoofing
- block bypass

Rank findings by severity.

Do not edit code.
```

---

# 85. AGENT — TRUST & SAFETY REVIEWER

```markdown
---
name: trust-safety-reviewer
description: Reviews Project Connect user-to-user features for safety-policy compliance. Use for discovery, dating, connection, messaging, events, block, report and moderation changes.
tools: Read, Grep, Glob
---

Review against docs/safety and approved business rules.

Verify:
- consent boundaries
- block precedence
- report availability
- dating opt-in
- location privacy
- reporter confidentiality
- moderator evidence scoping
- free safety access
- abuse resistance

Do not weaken safety for engagement or premium conversion.
```

---

# 86. AGENT — QA

```markdown
---
name: qa-engineer
description: Designs adversarial and edge-case tests for Project Connect changes. Use after feature implementation and bug fixes.
tools: Read, Grep, Glob
---

Think like a hostile and unlucky user.

Generate tests for:
- happy path
- boundary values
- duplicate requests
- concurrency
- stale state
- retry
- offline behavior
- unauthorized access
- block state
- suspension
- premium expiry
- invalid deep links
- provider failure

Prioritize business-rule failures over cosmetic cases.
```

---

# 87. OTHER AGENTS

Backend, mobile, database, accessibility, and DevOps agents should contain equivalent narrow responsibilities.

Do not give every agent unrestricted Bash/Edit by default.

Specialists should receive only the tools required for their job.

---

# 88. CLAUDE SETTINGS

Project settings belong in:

```text
.claude/settings.json
```

Project-level settings can be committed and shared; local personal overrides belong in `.claude/settings.local.json`. Anthropic currently documents this separation for project versus local settings.

---

# 89. PERMISSION PHILOSOPHY

Claude should execute without repeated approval for clearly safe read-only or verification commands.

Require explicit approval for actions that can:

- mutate dependency graph;
- mutate infrastructure;
- access network providers;
- destroy data;
- affect protected Git branches;
- access secrets.

---

# 90. SETTINGS BASELINE

Create:

```json
{
  "permissions": {
    "allow": [
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git show:*)",
      "Bash(pnpm format:check:*)",
      "Bash(pnpm lint:*)",
      "Bash(pnpm typecheck:*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm architecture:check:*)",
      "Bash(pnpm security:secrets:*)"
    ],
    "deny": [
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(terraform apply:*)",
      "Bash(terraform destroy:*)",
      "Bash(aws *:*)",
      "Bash(kubectl *:*)"
    ],
    "defaultMode": "default"
  }
}
```

Permission syntax and available modes should be checked against the installed Claude Code version using `/permissions`, because Anthropic actively evolves the permission system. Current documentation supports project-level allow/deny rules and plan/default-style permission modes.

---

# 91. DO NOT AUTO-ALLOW PACKAGE INSTALLS

Do not include broad rules such as:

```text
Bash(pnpm add:*)
npm install
```

in `allow`.

Package additions require review.

---

# 92. HOOKS

Anthropic currently supports project hooks in `.claude/settings.json`, and deterministic command hooks are preferable for production enforcement. Hooks execute with the developer's OS permissions, so every hook must be short, reviewed and repository-controlled.

We will use **command hooks only** initially.

Do not use experimental agent hooks as mandatory production controls.

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](SPEC-RECONCILIATION.md) R-11:** the Bash scripts in §93–§95 are superseded by cross-platform Node hooks: `.claude/hooks/guard-bash.mjs` (PreToolUse, matcher `Bash|PowerShell`; blocks never-autonomous commands and forces an approval prompt for R-01 actions) and `.claude/hooks/post-edit-format.mjs` (formats only the edited file with locally installed Prettier; never downloads). Configured in `.claude/settings.json` with a shell-agnostic loader (`node -e "import(...process.env.CLAUDE_PROJECT_DIR...)"`) so hooks resolve identically under Git Bash or PowerShell and from nested working directories. The guard returns structured `deny`/`ask` decisions (exit 0) rather than exit code 2, because some shells collapse non-zero exit codes and would make a block fail open.

---

# 93. HOOK — PROTECT DANGEROUS COMMANDS

Create:

```text
.claude/hooks/guard-bash.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT="$(cat)"

if echo "$INPUT" | grep -Eiq \
  'terraform[[:space:]]+(apply|destroy)|git[[:space:]]+push[[:space:]].*(--force|-f)|kubectl|aws[[:space:]]+.*(delete|terminate|destroy)|rm[[:space:]]+-rf[[:space:]]+/( |$)'; then
  echo "Blocked by Project Connect safety guard: high-risk command requires explicit human execution." >&2
  exit 2
fi

exit 0
```

Make executable:

```bash
chmod +x .claude/hooks/guard-bash.sh
```

---

# 94. HOOK — FORMAT AFTER EDIT

Create:

```text
.claude/hooks/post-edit-format.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail

pnpm prettier --write . >/dev/null 2>&1 || true
```

For a large repository, improve this later to format only the edited file instead of the entire repository.

---

# 95. HOOK CONFIGURATION

Before committing final syntax, validate against the installed Claude Code version using `/hooks`.

A conceptual project configuration is:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/guard-bash.sh"
          }
        ]
      }
    ]
  }
}
```

Anthropic currently documents hook configuration as event → matcher group → handlers, with `PreToolUse` able to deny an operation using exit code 2.

Do **not** copy hook configuration blindly without testing `/hooks` after installation, because Claude Code evolves quickly.

---

# 96. ARCHITECTURE CHECK SCRIPT

Create:

```text
scripts/check-architecture.mjs
```

Initial purpose:

Fail CI if obvious forbidden imports exist.

Checks should eventually detect:

```text
mobile importing apps/api
domain importing @nestjs/*
domain importing drizzle
controllers importing database module
raw HEX in feature UI
public DTO containing forbidden field identifiers
```

Initial simplified version:

```javascript
import { execSync } from 'node:child_process';

const forbiddenPatterns = [
  {
    command:
      "grep -R \"from ['\\\"]@nestjs\" apps/api/src/modules/*/domain --include='*.ts' || true",
    message: 'Domain layer may not import NestJS.',
  },
  {
    command:
      "grep -R \"drizzle\" apps/api/src/modules/*/domain --include='*.ts' || true",
    message: 'Domain layer may not import Drizzle.',
  },
  {
    command:
      "grep -R \"apps/api\" apps/mobile --include='*.ts' --include='*.tsx' || true",
    message: 'Mobile may not import backend application internals.',
  },
];

let failed = false;

for (const check of forbiddenPatterns) {
  const output = execSync(check.command, {
    encoding: 'utf8',
    shell: '/bin/bash',
  }).trim();

  if (output) {
    failed = true;
    console.error(`\n${check.message}\n`);
    console.error(output);
  }
}

if (failed) {
  process.exit(1);
}

console.log('Architecture checks passed.');
```

This script is a first guard, not the final architecture test framework.

---

# 97. SECRET CHECK SCRIPT

Do not attempt to reinvent enterprise secret scanners.

Use GitHub secret scanning where available and add a basic local protection script for obvious accidents.

Create:

```text
scripts/check-secrets.mjs
```

Search for common secret patterns while excluding lock/build files.

Do not print detected secret values to output.

---

# 98. GITHUB REPOSITORY

Once local foundation is ready:

```bash
git add .
git commit -m "chore: initialize Project Connect engineering foundation"
```

Create remote repository through approved GitHub workflow.

Then:

```bash
git remote add origin <repository-url>
git push -u origin main
```

Do not have Claude perform the initial protected-branch push autonomously.

---

# 99. CODEOWNERS

Create:

```text
.github/CODEOWNERS
```

Initial conceptual ownership:

```text
# Replace placeholders with real GitHub teams/users.

/apps/mobile/                 @mobile-team
/apps/api/                    @backend-team
/apps/admin/                  @backend-team
/apps/worker/                 @backend-team

/packages/ui/                 @mobile-team @design-team
/packages/design-tokens/      @mobile-team @design-team

/docs/safety/                 @trust-safety-team
/apps/api/src/modules/trust-safety/ @trust-safety-team @backend-team

/infrastructure/              @platform-team
/.github/workflows/           @platform-team

/apps/api/src/shared/auth/    @backend-team @security-team
/apps/api/src/**/authorization* @backend-team @security-team

/apps/api/**/migrations/      @backend-team @database-team
```

For a solo founder initially, replace with your GitHub username.

The structure still prepares for team growth.

---

# 100. PULL REQUEST TEMPLATE

Create:

```text
.github/pull_request_template.md
```

```markdown
# Summary

Describe what changed and why.

## Requirement

- Requirement / issue:
- Relevant specification:
- Relevant ADRs:

## Affected domains

- [ ] Mobile
- [ ] API
- [ ] Database
- [ ] Admin
- [ ] Worker
- [ ] Infrastructure
- [ ] Safety
- [ ] Billing

## Security & Privacy

Describe authorization, PII, safety, or security impact.

If none, state why none.

## Database

- [ ] No schema change
- [ ] Migration included

Migration notes:

## Analytics

Events added/changed:

## Testing

Commands executed:

```text
<actual commands>
```

## UI

Screenshots / recordings where relevant.

## Deployment Notes

Feature flags, migration order, configuration, or provider changes.

## Checklist

- [ ] Formatting passes
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Tests pass
- [ ] Architecture checks pass
- [ ] No secrets added
- [ ] Documentation updated
- [ ] Authorization reviewed
- [ ] Accessibility reviewed where applicable
```

---

# 101. GITHUB ACTION — CI

Create:

```text
.github/workflows/ci.yml
```

Baseline:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "24"
          cache: "pnpm"

      - name: Enable pnpm
        run: npm install --global pnpm@12

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Format
        run: pnpm format:check

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Architecture
        run: pnpm architecture:check

      - name: Unit tests
        run: pnpm test:unit
```

Pin action commit SHAs later for stronger supply-chain hardening.

---

# 102. INTEGRATION CI

Separate workflow/job should start PostGIS + Redis services.

Do not overload every tiny PR with expensive full mobile E2E until codebase warrants it.

Required at merge/release for critical backend changes.

---

# 103. CODEQL

Add GitHub CodeQL workflow once repository is on GitHub.

Enable JavaScript/TypeScript analysis.

Also enable:

- secret scanning;
- Dependabot.

---

# 104. DEPENDABOT

Create:

```text
.github/dependabot.yml
```

Group low-risk dependency updates where reasonable.

Do not automatically merge:

- auth;
- database;
- native mobile;
- billing;
- security packages.

---

# 105. BRANCH PROTECTION

Configure `main`:

Require:

- PR;
- CI status;
- no force push;
- no deletion;
- conversations resolved;
- CODEOWNERS review for protected domains when team exists.

Never work directly on `main` for features.

---

# 106. TERRAFORM SKELETON

Do not provision AWS yet.

Create structure:

```text
infrastructure/terraform/
├── modules/
│   ├── networking/
│   ├── ecs/
│   ├── rds/
│   ├── redis/
│   ├── s3/
│   ├── sqs/
│   └── monitoring/
│
└── environments/
    ├── development/
    ├── staging/
    └── production/
```

Each directory may initially contain README placeholders.

Infrastructure comes after the first local vertical architecture is proven.

---

# 107. TERRAFORM RULE

Do not provision AWS merely to say infrastructure exists.

Local Docker is sufficient while implementing:

- identity domain skeleton;
- profile;
- connections;
- basic messaging.

Cloud provisioning should occur before shared staging is required.

---

# 108. DOCUMENT IMPORT

Copy all approved artifacts from this planning sequence into the repository under appropriate `/docs` paths.

Recommended:

```text
docs/product/PRODUCT-REQUIREMENTS.md
docs/product/SCREEN-FUNCTIONAL-SPEC.md
docs/product/BUSINESS-RULES.md

docs/architecture/DATA-MODEL.md
docs/architecture/AUTHORIZATION.md
docs/architecture/SYSTEM-ARCHITECTURE.md
docs/architecture/CLAUDE-ENGINEERING-CONSTITUTION.md

docs/architecture/adr/ADR-001-*.md
...

docs/safety/TRUST-SAFETY.md
docs/design/DESIGN-SYSTEM.md
docs/analytics/ANALYTICS-SPEC.md
docs/operations/NOTIFICATIONS.md
```

This is critical.

Claude cannot obey documents that do not exist in the repository.

---

# 109. ADR FILE FORMAT

Do not store the entire ADR pack as one enormous file only.

Split accepted ADRs.

Example:

```text
docs/architecture/adr/
├── ADR-001-react-native-expo.md
├── ADR-002-modular-monolith.md
├── ADR-003-rest-openapi.md
├── ADR-004-postgresql-postgis.md
└── ...
```

An index can link all ADRs.

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](SPEC-RECONCILIATION.md) R-13:** done. `ADR-PACK.md` is kept as the preserved authoritative source; `ADR-001-*.md` … `ADR-100-*.md` are verified exact extracts, indexed by `adr/README.md`.

---

# 110. README

Root README should contain only operational essentials.

Example:

```markdown
# Project Connect

Production-grade Indian-diaspora social connection platform.

## Requirements

- Node 24 LTS
- pnpm 12
- Docker
- Claude Code
- WSL2 on Windows recommended

## Start

```bash
nvm use
pnpm install
cp .env.example .env
pnpm infra:up
pnpm dev
```

## Validate

```bash
pnpm check
pnpm architecture:check
```

## Documentation

See `/docs`.

## Claude Code

Read `CLAUDE.md`.
```

---

# 111. LOCAL DATABASE SEED

Create deterministic seed strategy.

Never random uncontrolled fake data.

Initial personas:

```text
social-frisco-woman
social-plano-man
dating-enabled-woman
dating-enabled-man
verified-user
unverified-user
blocked-user-a
blocked-user-b
suspended-user
premium-user
organizer-user
moderator-admin
event-manager-admin
```

---

# 112. SEED DATA MUST BE OBVIOUSLY SYNTHETIC

Use names such as:

```text
Test Ananya
Test Ravi
QA Priya
QA Arjun
```

Do not use copied real profiles.

---

# 113. INITIAL DATABASE MIGRATION

The very first migration should be extremely small.

Start with infrastructure proving tables such as:

```text
users
user_profiles
```

Do **not** create the full 40-table schema before the first vertical slice.

Our data model specifies destination architecture.

Implementation should migrate incrementally with feature slices.

---

# 114. WHY NOT CREATE ALL TABLES IMMEDIATELY

Premature complete schema creation creates:

- unused structures;
- migration burden;
- false sense of progress;
- increased AI hallucination surface.

Build schema according to validated feature dependency.

---

# 115. FIRST BOOTSTRAP HEALTH ENDPOINT

API must initially provide:

```text
GET /health/live
GET /health/ready
```

Before business features.

Readiness should validate essential runtime state without exposing internal details.

---

# 116. FIRST API RESPONSE

Example:

```json
{
  "data": {
    "status": "ok"
  }
}
```

No stack/environment secrets.

---

# 117. FIRST MOBILE SCREEN

The first mobile screen should not be the final Welcome UI.

Initially create a development-only bootstrap page showing:

```text
Project Connect

API: Connected
Environment: Development
```

Once architecture is green, replace with real product flow.

This validates mobile ↔ API communication before product UI work.

---

# 118. FIRST ADMIN SCREEN

Development-only:

```text
Project Connect Admin

API health: healthy
Authentication: not configured
```

Again, prove architecture before building operational workflows.

---

# 119. FIRST WORKER

Initial worker should consume a harmless local development queue abstraction or simply start and report health.

Do not implement real SQS locally on day one unless needed.

Introduce queue infrastructure when first async domain event is built.

---

# 120. LOCAL AWS EMULATION

Do not automatically introduce LocalStack.

It adds substantial complexity.

Mock/provider abstractions and local adapters are adequate initially.

Add LocalStack only if AWS-specific integration testing provides clear value.

---

# 121. FIRST COMPLETE CHECKPOINT

Repository bootstrap is complete when:

```bash
pnpm install
pnpm infra:up
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm architecture:check
```

all succeed from a clean clone.

---

# 122. CLEAN CLONE TEST

This is mandatory.

After initial setup:

```bash
cd ~/workspace
git clone <repo-url> project-connect-clean-test
cd project-connect-clean-test

nvm use
pnpm install --frozen-lockfile
cp .env.example .env
pnpm infra:up
pnpm check
```

If clean-clone setup fails, bootstrap is not complete.

---

# 123. CLAUDE VALIDATION

From clean repository:

```bash
claude
```

Ask:

```text
Read CLAUDE.md and inspect this repository.

Do not modify files.

Explain:
1. the architecture,
2. repository boundaries,
3. prohibited architectural changes,
4. required workflow for implementing a non-trivial feature,
5. commands you would run before declaring a change complete.
```

Claude's answer should reflect the approved constitution.

If not, improve repository instructions before writing features.

---

# 124. CLAUDE RULE VALIDATION

Test path-scoped behavior by asking Claude to inspect:

```text
apps/mobile
```

Then:

```text
apps/api/src/modules
```

Verify relevant rules are loaded and respected.

Anthropic's current model intentionally uses path-scoped rules to reduce always-on context cost.

---

# 125. CLAUDE AGENT VALIDATION

Run:

```text
/agents
```

Confirm project agents appear.

Test:

```text
Use the architect subagent to review the repository structure.
Do not edit anything.
```

Then:

```text
Use the security-reviewer subagent to identify any obvious risks in the current bootstrap.
```

---

# 126. CLAUDE HOOK VALIDATION

Run:

```text
/hooks
```

Claude Code currently provides a hook browser for verifying configured hook events and sources.

Confirm:

- project hook loaded;
- Bash matcher correct;
- command path correct.

Do not assume it works merely because JSON parses.

---

# 127. TEST DANGEROUS COMMAND BLOCK

Do **not** test against actual infrastructure.

Use a harmless mock command string or hook unit test.

Do not execute:

```text
terraform destroy
```

to see if the hook catches it.

---

# 128. CLAUDE PLAN MODE

For major features start Claude Code with plan permission mode:

```bash
claude --permission-mode plan
```

Claude Code currently supports a Plan mode designed for read-only planning before implementation.

Use Plan Mode particularly for:

- signup/auth;
- schema changes;
- discovery;
- connections;
- messaging;
- safety;
- billing.

---

# 129. DAY-TO-DAY CLAUDE WORKFLOW

Recommended:

### Step 1

Create feature branch:

```bash
git checkout -b feat/connection-requests
```

### Step 2

Start Claude:

```bash
claude --permission-mode plan
```

### Step 3

Prompt:

```text
Implement FR-CONN-001 through FR-CONN-005.

First read the relevant product, business-rule, authorization,
data-model and ADR documents.

Do not edit yet.

Give me:
- affected modules
- business rules
- data/API changes
- security/privacy impact
- test plan
- implementation sequence
```

### Step 4

Review plan.

### Step 5

Switch Claude into normal editing mode.

### Step 6

Implement.

### Step 7

Invoke:

```text
/prepare-pr
```

or corresponding project skill.

### Step 8

Use security/QA subagents.

### Step 9

Human review.

---

# 130. DO NOT PROMPT CLAUDE LIKE THIS

Avoid:

```text
Build the whole app.
```

or:

```text
Create every screen and backend.
```

This maximizes architecture drift.

---

# 131. GOOD FEATURE PROMPT

```text
Implement FR-CONN-001, FR-CONN-002 and BR-CONN-001 through BR-CONN-005.

Scope:
- backend connection request domain only
- no mobile UI in this change

Required:
- domain policy
- repository interface
- PostgreSQL persistence
- REST endpoint
- authorization
- OpenAPI
- integration tests

Do not:
- implement acceptance yet
- add new infrastructure
- add packages without approval

Read the related docs before planning.
```

This is the level of scope control we want.

---

# 132. CLAUDE CONTEXT MANAGEMENT

Do not force Claude to reread every long document every turn.

Use:

- concise `CLAUDE.md`;
- path rules;
- targeted docs;
- skills;
- subagents.

This matches Anthropic's current recommendation to use each steering mechanism according to its context and authority characteristics.

---

# 133. MCP POLICY

Do not install MCP servers during bootstrap simply because Claude supports them.

Initial repository requires **zero optional MCP integrations**.

Add later only when they improve a specific workflow.

Potential future:

```text
GitHub
Sentry
approved documentation sources
```

Each MCP server receives a security review because it expands Claude's reachable environment.

---

# 134. DATABASE MCP

Do not provide Claude Code unrestricted production database MCP access.

Local/dev DB tooling is adequate.

---

# 135. AWS MCP

Do not give Claude broad AWS write-capable MCP access during initial development.

Terraform + reviewed CI is safer.

---

# 136. PRODUCTION ACCESS MODEL

Claude Code should never need direct production PII for ordinary engineering.

Troubleshooting should use:

- sanitized logs;
- correlation IDs;
- metrics;
- controlled support/admin tools.

---

# 137. IDE CONFIGURATION

Optional `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.eol": "\n"
}
```

Optional `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-azuretools.vscode-docker"
  ]
}
```

Do not mandate IDE choice.

---

# 138. PACKAGE INSTALLATION WORKFLOW

If a package is required:

Claude must first state:

```text
Package:
Purpose:
Existing alternatives reviewed:
Security/maintenance:
Runtime/bundle impact:
Architecture impact:
```

Human approves.

Then install.

This prevents AI-generated dependency sprawl.

---

# 139. SECURITY BASELINE BEFORE FIRST FEATURE

Before implementing real user authentication, complete:

```text
[ ] secret scanning
[ ] dependency scanning
[ ] CodeQL
[ ] strict TypeScript
[ ] lint
[ ] architecture check
[ ] environment validation
[ ] no secrets in repo
```

---

# 140. FIRST IMPLEMENTATION EPIC AFTER BOOTSTRAP

Only after repository bootstrap passes clean-clone test:

## Foundation Epic

1. health API;
2. structured logging;
3. correlation IDs;
4. DB connection;
5. Redis connection;
6. base error model;
7. base OpenAPI;
8. mobile API client foundation;
9. design token foundation;
10. environment validation.

Then begin:

## Identity Vertical Slice

---

# 141. IDENTITY SLICE ORDER

```text
Age gate
↓
Phone input
↓
OTP request
↓
Twilio provider interface
↓
OTP verify
↓
User creation
↓
Session creation
↓
SecureStore
↓
Onboarding continuation
```

---

# 142. FIRST NON-TRIVIAL DB TABLE

`users`

Only fields required by identity/onboarding foundation.

Then add profile tables as profile functionality is implemented.

---

# 143. NEVER BIG-BANG GENERATE SCHEMA

Claude should not generate all 40 tables in one prompt.

Reason:

- weak reviewability;
- unused schema;
- hidden mistakes;
- difficult migration review.

---

# 144. FIRST CLOUD DEPLOYMENT

Do not deploy AWS immediately after bootstrap.

First reach:

```text
local mobile
↕
local API
↕
PostgreSQL
```

with tests green.

Then provision shared development/staging infrastructure through Terraform.

---

# 145. FIRST AWS ARTIFACTS

When cloud phase starts:

1. AWS account organization;
2. Terraform state backend;
3. VPC;
4. ECR;
5. ECS;
6. RDS;
7. Redis;
8. S3;
9. SQS;
10. monitoring.

Do not provision everything in one irreversible Terraform change.

---

# 146. NO PRODUCTION UNTIL STAGING

Required path:

```text
local
→ development/staging
→ production
```

No first deployment directly to production.

---

# 147. BOOTSTRAP SECURITY REVIEW

Once this setup exists, run independent Claude subagents:

```text
architect
security-reviewer
qa-engineer
```

Ask them to review only.

Do not let the implementation agent review itself as the sole approval.

---

# 148. REPOSITORY BOOTSTRAP DEFINITION OF DONE

The repository bootstrap is complete when all of the following are true:

## Toolchain

```text
[ ] Node 24 pinned
[ ] pnpm pinned
[ ] Docker functioning
[ ] Claude Code verified
```

## Repository

```text
[ ] pnpm workspace
[ ] Turborepo
[ ] strict TypeScript
[ ] ESLint
[ ] Prettier
[ ] Git ignore
[ ] EditorConfig
```

## Applications

```text
[ ] Expo mobile builds
[ ] NestJS API builds
[ ] Next.js admin builds
[ ] worker builds
```

## Shared Packages

```text
[ ] package boundaries established
[ ] design tokens package
[ ] API contract package
[ ] validation package
```

## Local Infrastructure

```text
[ ] PostGIS healthy
[ ] Redis healthy
```

## Quality

```text
[ ] lint green
[ ] typecheck green
[ ] tests green
[ ] architecture checks green
```

## Claude

```text
[ ] CLAUDE.md present
[ ] rules recognized
[ ] skills recognized
[ ] agents recognized
[ ] permissions reviewed
[ ] hooks inspected
```

## GitHub

```text
[ ] CI
[ ] PR template
[ ] CODEOWNERS
[ ] branch protection
[ ] secret scanning
[ ] CodeQL
[ ] Dependabot
```

## Documentation

```text
[ ] all approved artifacts stored under docs
[ ] ADRs split/indexed
```

## Reproducibility

```text
[ ] clean-clone bootstrap succeeds
```

---

# 149. FIRST GREEN BUILD COMMAND

Ultimately this must work:

```bash
nvm use
pnpm install --frozen-lockfile
pnpm infra:up
pnpm check
```

That command sequence becomes the engineering confidence baseline.

---

# 150. FIRST CLAUDE CODE PROMPT AFTER BOOTSTRAP

Use:

```text
You are working in the Project Connect repository.

Read:
- CLAUDE.md
- docs/architecture/SYSTEM-ARCHITECTURE.md
- docs/architecture/CLAUDE-ENGINEERING-CONSTITUTION.md
- relevant ADRs

Do not modify anything yet.

Inspect the repository and verify whether the engineering bootstrap
matches the approved architecture.

Return only:
1. architecture violations,
2. missing bootstrap controls,
3. security risks,
4. dependency problems,
5. recommended corrections.

Do not propose product features.
```

Fix all material findings before implementing Identity.

---

# 151. BOOTSTRAP CHANGE FREEZE

After the bootstrap is stable:

Tag:

```bash
git tag engineering-foundation-v1
```

Do not use the tag as deployment release.

It identifies the known-good engineering foundation.

---

# 152. WHAT HAPPENS NEXT

Once this repository bootstrap is physically created and verified, we move into:

## Phase 1 — Engineering Foundation Implementation

Actual files:

- package configuration;
- TypeScript;
- lint;
- CI;
- Docker;
- Claude files;
- health services.

## Phase 2 — Identity Vertical Slice

Actual product code begins.

## Phase 3 — Profile + Discovery

## Phase 4 — Connections + Messaging

## Phase 5 — Trust & Safety

## Phase 6 — Events

## Phase 7 — Monetization

---

# 153. IMPORTANT EXECUTIVE DECISION

At this point, **do not create another planning artifact before establishing the actual repository**.

The product has sufficient definition.

The architecture has sufficient governance.

The next value comes from physically creating and validating:

```text
Repository
+
Claude Code Configuration
+
Toolchain
+
Local Infrastructure
+
CI
```

Continuing to write more strategy documents before this would begin generating diminishing returns.

---

# 154. FINAL BOOTSTRAP POSITION

The goal is not:

> "Give Claude full access so it can build faster."

The correct goal is:

> **Give Claude high autonomy inside a carefully engineered safe operating envelope.**

The operating model becomes:

```text
Specifications define WHAT.

ADRs define HOW.

CLAUDE.md defines ALWAYS-ON constraints.

Rules define SCOPED constraints.

Skills define PROCEDURES.

Subagents provide INDEPENDENT expertise.

Hooks enforce deterministic guardrails.

CI proves correctness.

Humans retain authority over high-risk changes.
```

That is the foundation for using Claude Code like an engineering team rather than like an autocomplete tool.