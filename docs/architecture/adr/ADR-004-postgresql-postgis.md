# ADR-004 — POSTGRESQL + POSTGIS

## Status
ACCEPTED

## Decision

Use:

```text
PostgreSQL
+
PostGIS
```

as the primary transactional system of record.

---

## Rationale

Project Connect is highly relational:

- users;
- preferences;
- blocks;
- connections;
- conversations;
- events;
- subscriptions.

PostgreSQL provides:

- transactions;
- constraints;
- indexing;
- JSON where appropriate;
- spatial capabilities through PostGIS.

---

## Alternatives

### MongoDB

Rejected because primary domain is strongly relational and transactional.

### DynamoDB

Rejected due to complexity of multi-dimensional relational queries and discovery eligibility.

### Firebase/Firestore as Primary DB

Rejected because:

- authorization rules become tightly coupled to datastore;
- complex discovery/matching requires different modeling;
- backend domain rules remain essential.

---

## Consequences

Database schema quality becomes critical.

---

## Risks

Discovery joins may become expensive.

---

## Mitigation

- spatial indexes;
- proper relational indexes;
- projection queries;
- query-plan monitoring;
- later read models if necessary.

---

## Reversal Conditions

Add another datastore only if a proven workload cannot be solved efficiently in PostgreSQL.

Do not replace PostgreSQL casually.

---

## Claude Code Constraints

- use migrations;
- no schema-less blobs for core relationships;
- no direct public DB access;
- do not expose coordinates;
- preserve constraints.
