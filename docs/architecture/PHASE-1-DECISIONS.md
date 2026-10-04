# Phase 1 — Engineering Foundation Decisions

| Field | Value |
|---|---|
| Status | **APPROVED** |
| Date | 2026-10-04 |
| Approved by | Project owner |
| Scope | Phase 1 engineering repository foundation only (no product features) |

These decisions were approved during review of the Phase 1 engineering foundation plan. They are recorded as approved, without reinterpretation.

---

## D1 — Node 24 install method

**APPROVED.**

Use fnm on Windows. Pin repository to Node 24. Prefer exact current LTS patch after lookup.

## D2 — pnpm version

**APPROVED WITH RULE.**

Use pnpm 12, exact patch pinned after A1. Do not use generic npm latest; resolve from pnpm's 12 release/tag and pin exactly.

## D3 — Redis engine

**MODIFIED.**

Do not select Redis 7.2 yet. Our architecture remains Redis OSS. Determine the intended AWS ElastiCache Redis OSS engine first. Do not switch to Valkey without an ADR.

Clarifications:

- Project Connect remains on **Redis OSS**.
- The local Redis image will be chosen **only after the target ElastiCache Redis OSS engine is frozen**. For Phase 1, use a conservative compatible Redis 7.x local image; do not treat a newer local version as production equivalence.
- Local community Redis is **not assumed to be binary-equivalent** to AWS's ElastiCache engine.
- Adopting **Valkey requires an ADR**.
- This decision must not block other foundation work; the engine decision stays explicit.

## D4 — Expo + pnpm layout

**APPROVED.**

Start with pnpm isolated layout. Change to `nodeLinker: hoisted` only if Expo/Metro evidence requires it.

## D5 — Mobile component tests

**APPROVED.**

Defer component runner until the first real screen. No Jest ecosystem during foundation unless required.

## D6 — Package module format / Drizzle timing

**APPROVED WITH TEST.**

ESM shared packages if Node 24 smoke test proves Nest consumption works; CommonJS fallback if not. Defer Drizzle until first schema.

## D7 — gitleaks

**APPROVED.**

Skip initially. Use local secret scanner + GitHub secret scanning/push protection. Revisit later.

## D8 — Destructive Docker guard

**APPROVED.**

Add destructive Docker commands to the explicit approval tier.

*Implemented in commit `ed848d1` (`chore(governance): require approval for destructive Docker commands`).*

---

# A1 Dependency Decisions (G1–G10)

Approved after the A1 read-only version and compatibility research. Recorded as approved, without reinterpretation.

## G1 — PostgreSQL

PostgreSQL 17 / PostGIS 3.5.x.

Local image: `postgis/postgis:17-3.5`, pinned by digest. PostgreSQL 18 features are not needed for V1.

## G2 — Redis

Production ElastiCache Redis OSS 7.1; local maintained Redis 7.2.x; application restricted to ElastiCache-7.1-compatible commands.

- Production target frozen as **AWS ElastiCache Redis OSS 7.1**.
- Local development and CI image: **`redis:7.2.16`**, pinned by digest. The end-of-life `redis:7.0.15` image is **not approved** as the standard development/CI image.
- **Architectural rule:** application code must restrict itself to commands compatible with the ElastiCache Redis OSS 7.1 target.
- Redis OSS is approved. Valkey is not adopted; Valkey requires an ADR.
- This resolves the engine decision left open by D3.

## G3 — React

Admin React 19.2.8; mobile remains Expo-required 19.2.3.

- Mobile: React 19.2.3, React Native 0.86.3 (Expo SDK 57).
- Admin: React 19.2.8, React DOM 19.2.8.
- If a hoisted layout is ever forced and React resolution becomes problematic, revisit alignment then rather than downgrading the admin app in advance.

## G4 — pnpm

pnpm 12.8.2; `minimumReleaseAge: 2880`.

- `"packageManager": "pnpm@12.8.2"`.
- `minimumReleaseAge: 2880` (two-day cooldown).
- If an explicitly selected dependency is younger than 48 hours: do not disable the policy; use a sufficiently mature compatible patch or wait and re-review.
- pnpm may be upgraded after the foundation is green.

## G5 — ESLint

ESLint 9.39.5.

Approved set: `eslint 9.39.5`, `@eslint/js 9.39.5`, `typescript-eslint 8.71.0`, `eslint-plugin-import-x 4.17.1`, `globals 17.13.0`. Do not use ESLint 10 yet.

## G6 — TypeScript

TypeScript 6.0.3.

Approved: `typescript 6.0.3`, `@types/node 24.19.1`. Do not use TypeScript 7.

## G7 — GitHub pnpm action

`pnpm/setup` v3, SHA-pinned, automatic install disabled.

- `pnpm/setup` v3, not `pnpm/action-setup`, pinned to the verified full commit SHA (v3.0.0 → `fbda4c85fc2e1e08721cd8763afea8f48d60f024`, from A1).
- Configured with `install: false`, followed by an explicit `pnpm install --frozen-lockfile` step; versions come from `.nvmrc` / `packageManager`.

## G8 — Worker runner

Node built-in TypeScript for worker first.

No `tsx` initially. If a real gap is demonstrated later, `tsx` may be approved separately.

## G9 — Expo template extras

Remove unnecessary Expo template dependencies only after verification.

Sequence: generate official SDK 57 template → verify clean template → remove demo UI → identify unused template dependency → remove dependency → `expo-doctor` → bundle test. Do not hand-create a pseudo-Expo app.

## G10 — Node

Exact Node 24.21.0 pin.

- `.nvmrc`: `24.21.0`.
- `package.json`: `"engines": { "node": ">=24.21.0 <25" }`.

---

# pnpm Build Policy

Use current `allowBuilds`, not obsolete `onlyBuiltDependencies`. Every `allowBuilds=true` entry requires human dependency approval.

- The foundation starts with `allowBuilds: {}` in `pnpm-workspace.yaml`.
- A package that genuinely requires a build script is added as `some-approved-package: true` only after dependency approval.
- Verified against pnpm documentation (`pnpm.io/settings/build`): `onlyBuiltDependencies`, `onlyBuiltDependenciesFile`, `neverBuiltDependencies`, `ignoredBuiltDependencies` and `ignoreDepScripts` were removed in pnpm v11 and replaced by `allowBuilds`. Packages not listed are disallowed and treated as unreviewed. `strictDepBuilds` defaults to `true`, so an install fails if any dependency has an unreviewed build script.

---

# Phase 1 Status at Time of Recording

| Item | Status |
|---|---|
| A1 research | APPROVED |
| G1–G10 | DECIDED |
| A2 dependency set | APPROVED IN PRINCIPLE |
| A2 execution | BLOCKED until Node 24.21.0 is active (`node -v` returns `v24.21.0`) |

Approved A2 set: `pnpm 12.8.2`, `turbo 2.11.7`, `typescript 6.0.3`, `@types/node 24.19.1`, `prettier 3.9.9`, `eslint 9.39.5`, `@eslint/js 9.39.5`, `typescript-eslint 8.71.0`, `eslint-plugin-import-x 4.17.1`, `globals 17.13.0`, `vitest 5.0.3`, `@vitest/coverage-v8 5.0.3`, `vite 8.3.2`.

Not approved for A2: `@swc/core`, `unplugin-swc`, `tsx`, `esbuild` (direct), Drizzle, TanStack Query, Zustand, React Hook Form, SecureStore, Expo Notifications, OpenTelemetry SDK, Nest Swagger, Helmet, mobile component testing libraries.
