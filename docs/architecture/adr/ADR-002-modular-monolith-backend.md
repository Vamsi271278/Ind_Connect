# ADR-002 — MODULAR MONOLITH BACKEND

## Status
ACCEPTED

## Context

Project Connect contains several domains:

- identity;
- profiles;
- discovery;
- connections;
- messaging;
- events;
- safety;
- billing;
- admin.

These domains are distinct, but V1 does not require independent deployment or extreme scale.

---

## Decision

Use a:

**modular monolith**

implemented in NestJS.

One primary backend deployable with strict internal domain boundaries.

---

## Rationale

Provides:

- fast development;
- simple transactions;
- easier debugging;
- fewer deployment surfaces;
- simpler observability;
- lower infrastructure cost;
- easier local development;
- easier Claude-assisted code navigation.

---

## Alternatives Considered

### Microservices

Rejected because they add:

- distributed transactions;
- service discovery;
- network failure modes;
- schema coordination;
- contract overhead;
- deployment overhead.

V1 scale does not justify this.

---

### Serverless Functions Per Feature

Rejected because:

- domain boundaries become fragmented;
- cold starts may affect realtime paths;
- business logic tends to scatter;
- orchestration complexity increases.

---

## Consequences

Positive:
- simpler engineering organization.

Negative:
- discipline required to prevent monolith becoming tangled.

---

## Risks

- cross-domain imports;
- direct repository access across modules;
- growing deployment size.

---

## Mitigation

Each module contains:

```text
domain/
application/
infrastructure/
api/
```

Cross-domain access through:

- application interfaces;
- domain events;
- explicit read projections.

---

## Reversal Conditions

Split a domain only when:

- measurable scale bottleneck;
- different availability requirement;
- team ownership requires independent lifecycle;
- security isolation materially benefits;
- deployment cadence conflict becomes significant.

---

## Claude Code Constraints

Claude Code must not:

- create new microservices;
- bypass module interfaces;
- directly mutate another module's tables;
- add cross-module circular dependencies.
