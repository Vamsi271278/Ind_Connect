---
name: implement-feature
description: Implement a non-trivial Project Connect feature from approved requirements while preserving architecture, authorization, privacy, safety, analytics, testing, and documentation.
---

# Implement Feature

## 1. Establish authority
Identify:
- requirement IDs / approved user behavior
- relevant business rules
- relevant ADRs
- relevant safety/privacy/authorization rules

Read the minimum authoritative document set needed.

## 2. Inspect existing implementation
Find:
- owning domain/module
- current API/data contracts
- existing reusable patterns
- test conventions
- relevant feature flags/config

## 3. Produce a pre-edit plan
State:
- goal
- scope and explicit non-scope
- affected modules/files
- data/schema changes
- API changes
- authorization/safety/privacy impact
- analytics/notification impact
- test strategy
- migration/deployment implications

Do not edit until the plan is coherent.

## 4. Implement vertically
Prefer:
domain rule → persistence → transaction → API → client → analytics/notification → tests

Keep side effects async where architecture specifies.

## 5. Validate
Run the smallest relevant checks first, then:
- formatting
- lint
- typecheck
- targeted tests
- integration tests where needed
- architecture check
- security/safety review for high-risk work

## 6. Final review
Inspect the complete diff and report:
- implemented behavior
- tests/checks actually run
- security/privacy/safety considerations
- migrations/config/flags
- known limitations or unverified items

Never expand product scope just because implementation makes it convenient.
