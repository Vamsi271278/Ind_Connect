# ADR-022 — NO MICROservices V1

## Status
ACCEPTED

## Decision

Explicit prohibition unless superseding ADR approved.

---

## Why Separate ADR Exists

Because AI-assisted coding commonly over-engineers.

This ADR intentionally prevents accidental service sprawl.

---

## Do Not Create

- profile-service deployment;
- event-service deployment;
- user-service deployment;
- auth-service deployment

as independent containers merely because domains are logically separate.
