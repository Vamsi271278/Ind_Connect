# ADR-071 — DOMAIN LAYER FRAMEWORK INDEPENDENCE

## Status
ACCEPTED

Core domain logic should not import:

- NestJS decorators;
- AWS SDK;
- ORM objects.
