# ADR-007 — REDIS FOR EPHEMERAL STATE

## Status
ACCEPTED

## Decision

Use managed Redis for:

- rate limits;
- presence;
- temporary cache;
- WebSocket coordination;
- idempotency;
- ephemeral counters.

---

## Critical Rule

Redis is not the authoritative store for:

- messages;
- connections;
- subscription status;
- moderation records;
- blocks.

---

## Alternatives

### PostgreSQL Only

Rejected because high-frequency ephemeral state would create unnecessary DB load.

---

## Risk

Redis outage.

---

## Mitigation

Design features so Redis loss causes:

- degraded presence;
- reduced cache;
- controlled rate-limit fallback

not data loss.
