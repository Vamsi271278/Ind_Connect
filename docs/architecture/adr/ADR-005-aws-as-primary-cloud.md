# ADR-005 — AWS AS PRIMARY CLOUD

## Status
ACCEPTED

## Decision

Use AWS as V1 primary cloud provider.

---

## Rationale

AWS provides mature managed services for:

- container compute;
- PostgreSQL;
- Redis;
- queues;
- object storage;
- CDN;
- networking;
- secrets;
- monitoring;
- IAM.

---

## Alternatives

### GCP

Viable but rejected to maintain one operating model.

### Azure

Viable but offers no specific advantage for this product.

### Multi-cloud

Rejected as unnecessary complexity.

---

## Consequences

Cloud expertise centers around AWS.

---

## Risk

Vendor lock-in.

---

## Mitigation

Avoid deep proprietary dependencies in core domain logic.

Use abstractions for:

- storage;
- queues;
- secrets;
- providers.

---

## Reversal Conditions

Only if:

- material commercial requirement;
- regional/legal constraint;
- major cost imbalance;
- acquisition/enterprise requirement.
