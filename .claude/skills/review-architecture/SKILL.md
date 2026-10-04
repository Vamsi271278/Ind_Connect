---
name: review-architecture
description: Review the current Project Connect plan/diff for compliance with accepted ADRs and the approved modular-monolith architecture.
---

# Architecture Review

Check:
- ADR compliance
- app/package boundaries
- module ownership
- dependency direction
- domain framework independence
- controller/ORM separation
- cross-domain persistence mutation
- transaction boundaries
- outbox/async side effects
- provider abstraction
- server/client authority
- unapproved dependencies or infrastructure
- needless complexity
- reversibility

For each issue cite the governing ADR/rule when available.

If a legitimate requirement cannot fit the architecture, recommend an ADR proposal rather than silently approving a deviation.
