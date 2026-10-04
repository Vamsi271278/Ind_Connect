# ADR-008 — REST WRITE + WEBSOCKET DELIVERY FOR MESSAGING

## Status
ACCEPTED

## Decision

Message creation uses REST.

Realtime delivery uses WebSocket/Socket.IO.

---

## Canonical Flow

```text
REST POST
↓
Authorize
↓
Persist PostgreSQL
↓
Commit
↓
Outbox
↓
Realtime publish
↓
Push if recipient offline
```

---

## Rationale

This separates:

**durability**

from:

**realtime transport.**

---

## Alternatives

### WebSocket-Only Messaging

Rejected because:

- retry semantics are harder;
- idempotency less obvious;
- error handling harder;
- durable transaction coupling becomes fragile.

---

## Reversal Conditions

None anticipated for V1.
