# ADR-012 — SQS + TRANSACTIONAL OUTBOX

## Status
ACCEPTED

## Decision

Use:

- PostgreSQL transactional outbox;
- Amazon SQS;
- idempotent workers.

---

## Rationale

Critical business transactions often require async side effects.

Example:

Connection acceptance should not fail because push provider is down.

---

## Flow

```text
Business Transaction
+
Outbox Record
↓
Commit
↓
Publisher
↓
SQS
↓
Consumer
```

---

## Alternatives

### Direct synchronous provider calls

Rejected due coupling and inconsistent failure states.

### Kafka

Rejected as unnecessary V1 infrastructure.

---

## Delivery Guarantee

Assume:

**at least once**

Consumers must be idempotent.
