---
paths:
  - "apps/api/src/shared/database/**"
  - "apps/api/src/modules/**/infrastructure/persistence/**"
  - "**/migrations/**"
---

# Database Rules

- PostgreSQL/PostGIS is authoritative.
- Drizzle is approved persistence tooling, not a domain dependency.
- Every schema change requires a migration and migration review.
- Preserve constraints; never weaken integrity to satisfy code/tests.
- Breaking/destructive changes use expand-contract.
- Parameterize raw SQL.
- Review high-volume query plans and prevent N+1.
- Exact coordinates stay server-side.
- No continuous/background location history without explicit approval.
