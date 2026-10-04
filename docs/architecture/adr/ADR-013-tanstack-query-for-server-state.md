# ADR-013 — TANSTACK QUERY FOR SERVER STATE

## Status
ACCEPTED

## Decision

Use TanStack Query as mobile/admin server-state manager.

---

## Covers

- discovery;
- profiles;
- events;
- connections;
- messages metadata;
- notifications;
- subscription state.

---

## Rationale

Provides:

- cache;
- invalidation;
- loading states;
- retries;
- request dedupe.

---

## Critical Boundary

TanStack Query cache is not authoritative business state.
