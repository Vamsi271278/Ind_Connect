# ADR-036 — TRANSACTIONAL LOGGING + CORRELATION IDS

## Status
ACCEPTED

Every incoming backend request receives correlation ID.

Propagate through:

- DB-adjacent logs;
- queue messages;
- workers;
- provider calls.

---

## Rule

Logs are structured JSON.

No production `console.log()` for application telemetry.
