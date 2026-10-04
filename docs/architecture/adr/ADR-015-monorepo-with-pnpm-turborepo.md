# ADR-015 — MONOREPO WITH PNPM + TURBOREPO

## Status
ACCEPTED

## Decision

Use one repository for:

- mobile;
- admin;
- API;
- workers;
- shared packages;
- infrastructure.

Use:

- pnpm workspaces;
- Turborepo.

---

## Rationale

Supports:

- shared types;
- common validation;
- single CI;
- consistent tooling;
- easier Claude context.

---

## Risks

Accidental coupling.

---

## Mitigation

Workspace boundaries and lint rules.

---

## Reversal Conditions

Split repositories only when team/org boundaries justify independent ownership.
