# ADR-021 — DATA PRIVACY ARCHITECTURE

## Status
ACCEPTED

## Decision

Privacy is enforced structurally, not only through UI.

---

## Core Rules

- exact user coordinates never reach consumer client;
- phone/email excluded from public profile DTO;
- DOB never exposed;
- dating preferences sensitive;
- location history not retained by default;
- private verification media isolated;
- deletion orchestrated across domains.

---

## Profile Projection

Every other-user response passes through:

```text
ProfileProjectionService
```

---

## Principle

> Data not needed by a consumer must not be sent to the consumer.
