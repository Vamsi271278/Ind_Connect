# ADR-003 — REST + OPENAPI

## Status
ACCEPTED

## Decision

Use:

```text
REST
JSON
OpenAPI 3.1
```

for application APIs.

---

## Rationale

REST is appropriate for:

- resource-oriented workflows;
- strong authorization;
- clear HTTP semantics;
- generated clients;
- stable monitoring;
- easy caching;
- simpler security review.

OpenAPI becomes the formal client-server contract.

---

## Alternatives

### GraphQL

Rejected for V1 because:

- additional authorization complexity;
- query-cost controls;
- schema resolver overhead;
- easier accidental data over-fetching;
- unnecessary flexibility for current product.

---

### gRPC

Useful internally, but unsuitable as primary mobile interface.

Rejected for V1 external API.

---

## Consequences

Some endpoints will be task-oriented:

```text
POST /connection-requests/{id}/accept
```

That is acceptable.

---

## Reversal Conditions

GraphQL may be reconsidered if:

- many heterogeneous clients need complex projections;
- REST causes severe over/under-fetching;
- API composition becomes measurable burden.

---

## Claude Code Constraints

- no GraphQL server;
- no direct non-versioned APIs;
- every endpoint must have OpenAPI contract;
- API DTOs separate from database models.
