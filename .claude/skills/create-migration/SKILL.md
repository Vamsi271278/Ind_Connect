---
name: create-migration
description: Design a safe Project Connect PostgreSQL/PostGIS schema migration with compatibility, locking, backfill, deployment-order, and recovery analysis.
---

# Create Migration

Before writing a migration, state:
- business purpose
- current schema/state
- target schema
- affected tables
- estimated volume/criticality
- constraints/indexes
- locking risk
- backward compatibility
- backfill strategy
- deployment sequence
- recovery strategy

Present this analysis and **wait for explicit human approval before writing a production-impacting migration file** (SPEC-RECONCILIATION R-01). Planning and reviewing need no approval.

Use expand-contract for breaking/destructive changes.

Rules:
- preserve integrity constraints
- do not run production migrations
- parameterize backfills
- avoid long blocking operations where safer alternatives exist
- verify PostGIS/privacy implications for location data

After creation, run migration against a non-production PostgreSQL/PostGIS environment and execute relevant integration tests.
