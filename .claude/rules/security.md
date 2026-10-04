---
paths:
  - "apps/api/**"
  - "apps/admin/**"
  - "apps/worker/**"
  - "packages/api-contracts/**"
---

# Security Rules

- Treat clients as hostile.
- Authorization fails closed.
- Check IDOR/object authorization on every resource ID.
- Protect against mass assignment, injection, replay and stale authorization.
- Webhooks require authenticity and idempotency.
- Block/restriction state must beat stale caches and open realtime connections.
- Never log tokens, OTPs, auth headers, message bodies or exact location.
- Staff auth is separate and MFA is mandatory.
