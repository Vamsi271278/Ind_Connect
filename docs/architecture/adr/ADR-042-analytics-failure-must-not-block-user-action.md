# ADR-042 — ANALYTICS FAILURE MUST NOT BLOCK USER ACTION

## Status
ACCEPTED

If analytics provider fails:

- signup continues;
- request sends;
- report submits;
- payment state remains intact.

Analytics runs asynchronously/best effort.
