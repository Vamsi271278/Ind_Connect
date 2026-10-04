# ADR-027 — CENTRALIZED AUTHORIZATION POLICIES

## Status
ACCEPTED

## Decision

Complex business authorization lives in central policy services.

---

## Examples

```text
canViewProfile()
canSendConnectionRequest()
canMessage()
canRSVP()
canUseDating()
```

---

## Rejected Pattern

Permission logic duplicated in:

- controllers;
- UI;
- repository queries.
