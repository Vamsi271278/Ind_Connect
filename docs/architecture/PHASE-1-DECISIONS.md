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
