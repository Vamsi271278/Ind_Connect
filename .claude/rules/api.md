---
paths:
  - "apps/api/src/**/*.ts"
  - "packages/api-contracts/**/*.ts"
  - "packages/api-client/**/*.ts"
---

# API Rules

- Consumer prefix: `/api/v1`; admin prefix: `/admin/v1`.
- Controllers remain thin and never import persistence/ORM directly.
- Authenticate protected endpoints and derive actor identity from server context.
- Perform resource/object authorization for every supplied identifier.
- Validate external input at runtime.
- Return explicit context-specific DTOs; never ORM entities.
- Update OpenAPI for external API changes.
- Use cursor pagination for unbounded lists.
- Retry-sensitive mutations require idempotency.
- Never expose private profile/safety/moderation/location data.
