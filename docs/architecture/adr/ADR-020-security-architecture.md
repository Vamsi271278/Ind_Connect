# ADR-020 — SECURITY ARCHITECTURE

## Status
ACCEPTED

## Decision

Project Connect adopts:

**defense in depth**

rather than relying on any single control.

Layers:

```text
WAF
↓
Rate Limits
↓
Authentication
↓
Authorization
↓
Domain Validation
↓
Data Projection
↓
Database Constraints
↓
Audit
↓
Monitoring
```

---

## Key Requirements

- short-lived access tokens;
- refresh-token rotation;
- staff MFA;
- admin isolation;
- secrets manager;
- KMS encryption;
- private DB/Redis;
- object-level authorization;
- IDOR testing;
- restricted PII.

---

## Fail Policy

Authorization:

**fail closed**

Analytics:

**fail open**

Push:

**fail open after durable state**
