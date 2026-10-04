# ADR-044 — SECURITY INVALIDATION OVERRIDES CACHE

## Status
ACCEPTED

Events requiring rapid invalidation:

- block;
- suspension;
- ban;
- role revocation.

Do not allow stale cache to continue authorization.
