# ADR-047 — VERSIONED DATABASE MIGRATIONS

## Status
ACCEPTED

All schema change uses migration files.

Production migrations run via dedicated deployment step.

---

## Prohibited

- manual production schema edits;
- application startup auto-migration.
