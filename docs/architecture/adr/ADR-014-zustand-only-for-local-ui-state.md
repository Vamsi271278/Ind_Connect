# ADR-014 — ZUSTAND ONLY FOR LOCAL UI STATE

## Status
ACCEPTED

## Decision

Use Zustand sparingly.

Examples:

- temporary filters;
- onboarding UI draft;
- modal coordination;
- UI preferences.

---

## Rejected Pattern

Do not build a giant global store containing all server objects.

---

## Alternatives

### Redux Toolkit

Powerful, but unnecessary complexity given TanStack Query.
