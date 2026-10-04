# ADR-029 — DATABASE TRANSACTIONS FOR RELATIONSHIP STATE

## Status
ACCEPTED

## Decision

Critical state changes must be transactional.

Examples:

- accept connection;
- block user;
- RSVP capacity;
- entitlement processing.

---

## Example Connection Transaction

```text
lock request
validate
mark accepted
create connection
create conversation
create participants
write outbox
commit
```

No partial state allowed.
