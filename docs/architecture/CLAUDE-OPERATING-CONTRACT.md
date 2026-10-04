# Project Connect — Claude Operating Contract (Full Reference)

> **Status (2026-10-04):** This document was the original root `CLAUDE.md`. It is preserved verbatim below as the full operating-contract reference, companion to `CLAUDE-ENGINEERING-CONSTITUTION.md`. The always-loaded root `CLAUDE.md` is now a short master file.
>
> Where this text conflicts with [`SPEC-RECONCILIATION.md`](SPEC-RECONCILIATION.md), the reconciliation record governs. In particular, the approval policy in §33 and §47 below is superseded by **R-01** (every package install/removal requires human approval, not only high-risk packages).

> **Repository operating contract for Claude Code and all AI-assisted engineering**
>
> This file is intentionally concise enough to remain useful as always-on project context.
> Detailed requirements live under `docs/` and must be read when relevant.
>
> **If this file conflicts with a formally approved product, safety, privacy, authorization, or ADR document, follow the source-of-truth hierarchy below and flag the conflict before implementation.**

---

## 1. Product Mission

Project Connect is an **18+ verified Indian-diaspora connection platform** for:

- friendship,
- activities,
- community events,
- professional networking,
- and explicitly opt-in dating.

The product is **not** a generic chat app, matrimony portal, public social feed, or swipe-first hookup app.

The core product model is:

**Location + Intent + Interests + Trust → Relevant Discovery → Mutual Connection → Safe Conversation → Real-World or Ongoing Relationship**

The initial launch market is **Dallas–Fort Worth**. Build for local network density first; do not introduce global-scale complexity unless an approved requirement or ADR requires it.

---

## 2. Engineering Priority Order

When tradeoffs conflict, use this priority:

1. User safety
2. Security
3. Privacy
4. Data integrity
5. Authorization correctness
6. Approved product behavior
7. Accessibility
8. Reliability
9. Maintainability
10. Testability
11. Performance
12. Developer convenience
13. Speed of implementation

Never sacrifice a higher-priority concern merely to make implementation easier or faster.

---

## 3. Source of Truth

Before implementing non-trivial work, locate and read the relevant approved documents under `docs/`.

Use this precedence when documents conflict:

1. Trust & Safety policy/specification
2. Privacy and Authorization specification
3. Business Rules / Functional Requirements
4. Accepted Architecture Decision Records
5. Data Model / Data Dictionary
6. Screen-by-Screen UX + Functional Specification
7. Product Requirements Document
8. Design System
9. Analytics / Notification specifications
10. Implementation ticket or task
11. Existing code

**Existing code is not automatically correct because it exists.**

If a lower-level instruction conflicts with a higher-level approved source:
- do not silently choose,
- describe the conflict,
- identify the affected requirement/ADR,
- propose the smallest compliant resolution.

---

## 4. Required Documentation Lookup

For any meaningful feature, inspect only the documents relevant to that change.

Typical locations:

```text
docs/
├── product/
├── architecture/
│   └── adr/
├── safety/
├── design/
├── analytics/
└── operations/
```

Examples:

- Authentication → PRD + authorization + data model + auth ADRs
- Dating → PRD + business rules + authorization + safety
- Messaging → functional spec + authorization + safety + notifications
- Subscription → monetization rules + authorization + billing ADR
- UI component → screen spec + design system + accessibility requirements
- Schema change → data model + relevant ADR + migration rules

Do not read every long document for every small change. Read the minimum authoritative set needed to make a correct decision.

---

## 5. Frozen V1 Architecture

The following architecture is approved for V1:

### Mobile
- React Native
- Expo
- Expo Router
- TypeScript strict mode
- TanStack Query for server state
- Zustand only for limited local/transient UI state
- Zod
- React Hook Form
- Expo SecureStore

### Backend
- Node.js LTS
- NestJS
- TypeScript strict mode
- Modular monolith
- REST + JSON
- OpenAPI 3.1
- WebSocket/Socket.IO for realtime delivery where required

### Data
- PostgreSQL
- PostGIS
- Redis for ephemeral/cache/rate-limit/realtime coordination only
- PostgreSQL remains the system of record

### Async
- Amazon SQS
- Transactional outbox
- Idempotent workers

### AWS
- ECS Fargate
- RDS PostgreSQL
- ElastiCache Redis
- S3
- CloudFront
- WAF
- Secrets Manager
- KMS

### Integrations
- Twilio Verify
- RevenueCat
- PostHog
- Sentry
- pluggable identity-verification provider

### Admin
- Next.js
- separate staff authentication/security boundary

### Engineering
- pnpm workspaces
- Turborepo
- Terraform
- GitHub Actions
- EAS

Architecture changes require an ADR.

---

## 6. Technologies Explicitly Not Approved for V1

Do **not** introduce these unless a new approved ADR explicitly supersedes the existing decision:

- microservices,
- Kubernetes / EKS,
- GraphQL,
- Kafka,
- MongoDB as a core datastore,
- DynamoDB as the primary datastore,
- Firebase as the primary backend/database,
- Elasticsearch / OpenSearch,
- event sourcing,
- heavy CQRS frameworks,
- ML/vector-database recommender systems,
- background continuous GPS tracking,
- arbitrary global people search,
- contact-book ingestion for growth,
- custom authentication infrastructure,
- custom app-store billing infrastructure.

“Industry standard”, “more scalable”, “modern”, or “popular” are not sufficient reasons to violate an ADR.

---

## 7. Repository Boundaries

Expected top-level structure:

```text
apps/
  mobile/
  api/
  worker/
  admin/

packages/
  ui/
  design-tokens/
  api-client/
  api-contracts/
  domain-types/
  validation/
  config/
  analytics/
  observability/
  testing/

docs/
infrastructure/terraform/
scripts/
.claude/
.github/
```

Rules:

- applications must not import internals from other applications;
- mobile must never import backend source code;
- admin must use APIs/contracts, not database internals;
- shared packages require a coherent, narrow responsibility;
- do not create a generic dumping-ground `common` or `utils` package;
- do not move business logic into shared packages merely to reuse it.

---

## 8. Backend Architecture

Each significant domain should follow a structure conceptually equivalent to:

```text
module/
├── domain/
├── application/
├── infrastructure/
└── api/
```

Dependency direction:

```text
API → Application → Domain
                  ↑
        Infrastructure implements ports
```

### Domain layer must not depend on:
- NestJS decorators,
- Drizzle/ORM-specific models,
- AWS SDK,
- Redis,
- HTTP request/response objects,
- provider SDKs.

### Controllers must:
- validate requests,
- rely on authenticated actor context,
- call application services,
- map explicit responses.

### Controllers must not:
- contain major business rules,
- perform SQL,
- calculate permissions,
- call ORM repositories directly,
- contain ranking logic,
- contain payment entitlement logic.

### Cross-domain rule
One domain must not directly update another domain’s persistence tables.

Use:
- application interfaces,
- explicit domain/application services,
- domain events,
- approved projections.

---

## 9. TypeScript Rules

All TypeScript projects use:

```json
{
  "strict": true
}
```

Expected strictness includes:
- `noImplicitAny`,
- `noUncheckedIndexedAccess`,
- `exactOptionalPropertyTypes`,
- `useUnknownInCatchVariables`,
- `noImplicitOverride`,
- `noFallthroughCasesInSwitch`.

### Prohibited by default
- `any`,
- `@ts-ignore`,
- unsafe unchecked casting,
- non-null assertions used to suppress real uncertainty.

Prefer:
- `unknown` at untrusted boundaries,
- runtime validation,
- discriminated unions,
- exhaustive switches,
- explicit domain types.

`@ts-expect-error` is allowed only when an external-library limitation is understood and documented.

---

## 10. Runtime Validation

Static typing does not validate external data.

Validate untrusted boundaries with Zod or an approved equivalent, including:
- HTTP request input,
- webhook payloads,
- environment/configuration,
- deep-link parameters,
- provider responses when the provider contract is not guaranteed,
- user-entered data.

Client validation improves UX.

**Server validation protects integrity and security.**

Never rely on client-side validation alone.

---

## 11. API Rules

Public consumer APIs live under:

```text
/api/v1
```

Admin APIs use a distinct administrative namespace/security boundary.

Rules:

- REST is the approved API style;
- externally visible endpoints must be represented in OpenAPI;
- actor identity comes from authenticated session/context;
- never accept a client-supplied “acting user” as authority;
- every resource ID requires object-level authorization;
- use explicit API DTOs;
- never return ORM/database entities directly;
- unbounded collections use cursor pagination;
- retry-sensitive mutations require idempotency;
- stable domain error codes are preferred over infrastructure errors.

Never expose:
- SQL errors,
- provider internals,
- stack traces,
- AWS internals,
- internal authorization reasoning that leaks private state.

Where privacy requires concealment, avoid revealing whether an inaccessible resource exists.

---

## 12. Public Data Projection

Consumer APIs must return only the data required for the current context.

Public or other-user profile responses must never expose:

- raw DOB,
- phone number,
- email address,
- exact latitude/longitude,
- moderation history,
- report history,
- raw verification artifacts,
- private safety state,
- private dating preference internals,
- internal risk scores.

Use explicit context-aware projections such as:
- self profile,
- public discovery profile,
- connected profile,
- moderator projection,
- support projection.

Never fetch a large internal user object and rely on the frontend to hide fields.

---

## 13. Privacy Rules

Privacy is structural, not cosmetic.

Mandatory V1 rules:

- exact location never reaches consumer clients;
- expose city/metro and approved rounded distance only;
- do not retain continuous location history;
- no background location tracking;
- do not collect data “because it may be useful later”;
- no production PII in dev/test/staging;
- private verification artifacts must be isolated from public media;
- logs, analytics, and telemetry must minimize personal data.

Do not add sensitive profile attributes such as:
- immigration status,
- caste,
- religion,
- salary,
- home address,
- government ID fields outside an approved verification workflow,

without explicit product, privacy, and legal approval.

---

## 14. Trust & Safety Invariants

These are non-negotiable unless the approved safety/product specifications are formally changed:

- platform is 18+ only;
- no anonymous chat;
- no stranger direct messaging;
- connection acceptance is required before normal messaging;
- dating requires explicit opt-in;
- dating opt-in is not consent to sexual content;
- event attendance does not imply dating/contact consent;
- block acts immediately;
- block has system-wide precedence;
- reporting remains available to free users;
- reporter identity is confidential;
- safety capabilities are never premium-only;
- verification means verification completed, not “safe user”;
- exact location is never public;
- moderators access scoped evidence only;
- premium cannot bypass consent, block, moderation, or safety limits.

If convenience, engagement, revenue, or performance conflicts with safety, safety wins.

---

## 15. Block Precedence

A block must affect all relevant surfaces, including:

- discovery,
- direct profile access where appropriate,
- pending connection requests,
- new connection attempts,
- existing connection state,
- message sending,
- realtime message delivery,
- attendee discovery,
- social notifications where appropriate.

An old client state, deep link, cached profile, WebSocket connection, or premium entitlement must never bypass a block.

Re-authorize server-side at action time.

---

## 16. Dating Rules

Dating is an explicit context, not an inferred status.

Server remains final authority for dating eligibility.

Never:
- expose users to dating discovery without opt-in,
- infer consent from marital/social/event state,
- expose private dating settings on general profile surfaces,
- allow premium to override dating compatibility,
- turn the entire application into a separate red/pink “dating app” experience.

Dating behavior changes require product + safety review.

---

## 17. Authentication and Sessions

Phone OTP provider verifies the challenge.

**Project Connect owns the application account and session.**

Rules:
- short-lived access tokens;
- refresh tokens are high-entropy, revocable, and rotated;
- store refresh tokens hashed server-side;
- detect refresh-token replay/reuse;
- mobile credentials use SecureStore;
- never place secrets/tokens in AsyncStorage;
- never log tokens or OTP values;
- staff authentication is separate from consumer authentication;
- staff MFA is mandatory.

Do not treat Twilio, RevenueCat, or another external provider as general Project Connect authorization.

---

## 18. Authorization

Use:

**RBAC + ABAC + resource relationship/ownership policy**

Not:
- UI hiding,
- simple `isAdmin`,
- possession of a UUID,
- premium status,
- client-side checks.

Authorization evaluation should generally consider:

1. authentication,
2. account status,
3. safety restrictions,
4. block relationship,
5. resource ownership/participation,
6. context eligibility,
7. entitlement,
8. feature flag,
9. action-specific rule.

Default policy: **deny if permission cannot be established.**

Centralize complex policy in named services/policies.

---

## 19. Database Rules

PostgreSQL/PostGIS is authoritative.

Rules:
- every schema change uses a migration;
- no manual production schema edits;
- preserve foreign keys and uniqueness constraints;
- important invariants must be enforced at DB level where practical;
- use transactions for atomic state changes;
- use parameterized SQL only;
- raw SQL is acceptable for PostGIS/complex performance-sensitive queries when reviewed;
- avoid N+1 behavior;
- monitor/query-plan critical paths;
- do not add speculative indexes without a query reason.

Use expand-contract for breaking/destructive changes:

```text
expand
→ deploy compatible code
→ backfill
→ switch reads/writes
→ contract later
```

Never automatically execute production migrations from application startup.

---

## 20. Critical Transaction Boundaries

Operations that must remain atomic include, where applicable:

### Connection acceptance
- verify pending state,
- re-check current eligibility,
- mark accepted,
- create connection,
- create conversation/participants,
- write outbox event,
- commit.

### Block
- create block,
- invalidate relevant requests/relationships,
- update communication state as defined,
- emit safety/domain event,
- commit consistently.

### Event RSVP
- validate event,
- enforce capacity/waitlist rules,
- write RSVP state atomically.

### Billing entitlement update
- validate provider event,
- enforce idempotency,
- update subscription/entitlement coherently.

Do not leave partially valid relationship states.

---

## 21. Redis Rules

Redis is approved for:
- caching,
- rate limiting,
- ephemeral presence,
- WebSocket fan-out,
- short-lived idempotency data,
- transient counters.

Redis must not be the sole authoritative store for:
- users,
- connections,
- blocks,
- messages,
- reports,
- subscriptions,
- permanent entitlements.

Safety-critical authorization must not rely on stale long-lived cache.

Fast invalidation is mandatory for:
- blocks,
- suspensions,
- bans,
- admin-role revocation.

---

## 22. Async and Domain Events

For durable user operations:

```text
Validate
→ Authorize
→ Persist
→ Commit
→ Publish
→ Deliver side effects
```

Never:

```text
Deliver externally
→ hope persistence succeeds
```

Use transactional outbox for business-critical asynchronous side effects.

SQS is at-least-once delivery.

Therefore consumers must be idempotent.

Important queues require DLQs and operational visibility.

---

## 23. Messaging

Database state is authoritative.

Recommended send flow:

```text
POST message
→ authenticate
→ authorize participant
→ re-check connection/block/restrictions
→ validate content
→ persist message
→ outbox
→ commit
→ realtime delivery
→ push fallback
```

WebSocket is delivery transport, not the sole durable mutation mechanism.

Offline recipients recover messages from durable storage.

---

## 24. Mobile State Management

### TanStack Query
Owns server state such as:
- discovery,
- profiles,
- events,
- connections,
- conversation metadata,
- notifications,
- subscription state.

### Zustand
Allowed only for limited local/transient state such as:
- onboarding draft,
- UI preference,
- temporary filters,
- modal coordination.

Do not mirror the server database into Zustand.

Routes/screens should orchestrate data and components, not contain domain logic.

Use a centralized/generated API client.

No feature-specific random `fetch()` calls.

---

## 25. Design System

User-facing code must use approved semantic design tokens and reusable components.

Do not:
- hard-code arbitrary brand colors in feature screens,
- invent a second component library,
- install another icon set casually,
- create `DatingButton`, `EventPurpleButton`, etc. when shared variants solve the need,
- make swipe-only discovery the core experience,
- create premium social-status crowns/gold badges.

Design priorities:
- human,
- calm,
- trustworthy,
- premium,
- accessible,
- intentional.

Accessibility is part of Definition of Done.

---

## 26. Accessibility

Every user-facing feature must consider:

- semantic role,
- accessible name/label,
- accessible state,
- text scaling,
- minimum touch target,
- contrast,
- non-color-only status,
- focus behavior,
- keyboard behavior where relevant,
- screen-reader navigation.

Do not mark a screen complete without considering accessibility states.

---

## 27. Media and File Uploads

Client uploads must not directly create publicly trusted media.

Expected flow:

```text
authorize upload
→ issue short-lived upload authorization
→ upload
→ validate/decode
→ strip sensitive metadata
→ moderate where required
→ approve
→ publish
```

Rules:
- do not trust filename extension;
- validate MIME/magic bytes/content;
- restrict file size/type;
- strip GPS-sensitive EXIF from user-facing images;
- private verification/safety media must not use public CDN access.

---

## 28. External Providers

Wrap external providers behind narrow interfaces.

Examples:
- `PhoneVerificationProvider`
- `PushProvider`
- `SubscriptionProvider`
- `IdentityVerificationProvider`
- `AnalyticsProvider`
- `MediaModerationProvider`

Provider SDK objects must not leak across the domain layer.

All outbound network calls require:
- explicit timeout,
- classified retries,
- observability,
- safe error translation.

Do not retry permanent validation/authentication failures blindly.

---

## 29. Subscription and Entitlement Rules

RevenueCat helps manage store lifecycle.

It does not replace backend authorization.

Backend is final authority for protected premium APIs.

Never let:
- local client entitlement,
- cached subscription state,
- manipulated UI state

grant privileged server access.

Premium may improve convenience/discovery features.

Premium must never grant:
- consent bypass,
- block bypass,
- safety bypass,
- moderation exemption,
- private-data access.

---

## 30. Notifications

Push is best-effort transport.

In-app notification/domain state is authoritative where specified.

Rules:
- push failure never rolls back a successful domain transaction;
- deep links re-authorize on open;
- blocked/stale resources must fail safely;
- do not include exact location, report details, or private data in push payloads;
- private message body preview is off by default unless approved preference says otherwise;
- do not send explicit connection-decline notifications;
- respect user preferences and quiet hours except approved critical categories.

---

## 31. Analytics

Analytics must not block primary product behavior.

Use approved event names from the analytics specification.

Do not invent synonyms casually.

Never send to product analytics:
- names,
- phone,
- email,
- DOB,
- exact coordinates,
- OTP,
- auth token,
- private message body,
- report free text,
- moderator notes,
- verification images.

Critical business outcomes should be emitted from backend truth where feasible.

Examples:
- connection accepted,
- RSVP committed,
- subscription entitlement changed,
- moderation action applied.

---

## 32. Observability and Logging

Backend logs should be structured.

Every inbound request should support a correlation/request ID propagated through:
- API,
- outbox,
- worker,
- provider calls.

Never log:
- credentials,
- OTPs,
- auth headers,
- refresh/access tokens,
- private message content,
- exact coordinates,
- unnecessary PII.

Observability should answer:
- is it working?
- is it failing?
- how slow?
- where?
- why?

Do not turn user content into telemetry.

---

## 33. Dependency Policy

Do not add dependencies casually.

Before adding a production dependency, explicitly assess:
- what problem it solves,
- whether approved code/platform capability already solves it,
- maintenance health,
- security posture,
- license,
- bundle/runtime size,
- native compatibility if mobile,
- architecture impact.

Human approval is required before adding packages affecting:
- authentication,
- cryptography,
- payments,
- database,
- native mobile functionality,
- file parsing,
- security,
- cloud infrastructure.

Do not install a package to avoid writing a small, clear, well-tested helper.

---

## 34. Infrastructure Rules

Infrastructure is Terraform-managed.

Production:
- database and Redis stay private;
- use least-privilege IAM;
- use Secrets Manager/KMS;
- no secrets in repository or Terraform literals;
- no broad wildcard IAM unless technically unavoidable and documented;
- production mutation/deployment requires human approval.

Do not introduce Kubernetes.

Do not perform normal production “clickops”.

Emergency console changes must be reconciled back into Terraform.

---

## 35. Secrets

Never commit:
- API keys,
- passwords,
- signing keys,
- AWS credentials,
- Twilio auth tokens,
- billing secrets,
- production DSNs containing credentials.

`.env.example` contains names and safe placeholders only.

Treat any credential embedded in a mobile app as public.

Do not place secrets in:
- `CLAUDE.md`,
- documentation,
- test snapshots,
- prompts,
- source comments.

---

## 36. Testing Strategy

Test behavior, invariants, and failure modes—not implementation trivia.

Use appropriate layers:
- unit,
- domain/policy,
- integration,
- API contract,
- component,
- E2E.

Critical business behavior needs explicit tests even if overall coverage is high.

Mandatory adversarial cases include, where relevant:
- stranger cannot message,
- blocked user cannot message/discover,
- old deep link cannot bypass block,
- dating opt-out removes dating eligibility,
- premium cannot bypass safety,
- suspended/banned user cannot interact,
- unauthorized resource IDs fail,
- entitlement spoofing fails,
- duplicate/retried request is idempotent,
- event capacity cannot overbook,
- stale client state does not bypass server rules.

Backend integration tests use real PostgreSQL/PostGIS behavior.

Do not replace meaningful integration behavior with SQLite.

---

## 37. Bug-Fix Workflow

For non-trivial defects:

```text
Reproduce
→ establish root cause
→ identify security/safety/data impact
→ add or identify regression test
→ make smallest correct fix
→ run targeted + adjacent tests
→ review final diff
```

Do not:
- patch symptoms without understanding the cause,
- remove validation to make tests pass,
- weaken authorization because the frontend “already prevents it”,
- make unrelated refactors inside an urgent bug fix.

---

## 38. Feature Workflow

For non-trivial features:

1. Identify the approved requirement(s).
2. Read the minimum relevant specifications/ADRs.
3. Inspect existing implementation and conventions.
4. Identify affected modules.
5. Identify authorization, privacy, safety, data, analytics, notification implications.
6. Produce a concise implementation plan **before editing**.
7. Implement the smallest coherent vertical change.
8. Add tests at the appropriate layers.
9. Run formatter/lint/typecheck/tests.
10. Run architecture/security checks where relevant.
11. Inspect the complete diff.
12. Report exactly what was verified and what remains unverified.

Do not generate the entire application in one task.

---

## 39. Plan Before Editing

Planning is required before:
- new domain feature,
- schema change,
- API contract change,
- auth/session change,
- authorization change,
- safety change,
- billing change,
- major refactor,
- infrastructure change,
- cross-domain implementation.

A good plan states:
- goal,
- source requirements,
- affected modules/files,
- data changes,
- API changes,
- security/privacy/safety implications,
- test approach,
- migration/deployment implications.

Trivial typo/documentation-only fixes do not require ceremonial planning.

---

## 40. Architecture Change Protocol

If a requirement appears incompatible with the approved architecture:

**Do not silently deviate.**

Produce:

```text
Problem
Evidence
Affected ADR(s)
Options considered
Recommended change
Benefits
Risks
Migration impact
Reversal/rollback approach
Proposed superseding ADR
```

Wait for approval before architectural implementation.

---

## 41. Migration Change Protocol

Before a meaningful migration, state:
- purpose,
- current schema,
- new schema,
- affected volume,
- locking risk,
- compatibility,
- backfill,
- deployment order,
- recovery plan.

Never execute production migrations autonomously.

---

## 42. High-Risk Areas

Changes involving these areas require heightened review:

- authentication,
- sessions/tokens,
- authorization,
- blocks,
- reports/moderation,
- dating eligibility,
- subscriptions/payments,
- account deletion,
- admin permissions,
- precise/sensitive data,
- schema migrations,
- Terraform/cloud configuration,
- external webhooks.

For high-risk work, prefer independent review:
- implementation agent,
- security reviewer,
- QA/adversarial reviewer,
- trust & safety reviewer where relevant.

---

## 43. Git and Change Discipline

Use small, coherent changes.

Avoid unrelated refactors inside feature PRs.

Before declaring work complete:
- inspect `git status`,
- inspect the full diff,
- verify no unintended/generated/private files were added,
- run the required validation commands.

Never:
- force-push protected branches,
- bypass CI to “save time”,
- commit secrets,
- self-approve a high-risk change,
- claim checks passed when they were not run.

---

## 44. Definition of Done — General

A feature is not done because the code compiles.

Where applicable, Done includes:
- approved behavior implemented,
- server-side validation,
- authorization,
- privacy controls,
- safety behavior,
- data integrity,
- loading state,
- empty state,
- error state,
- offline/degraded behavior,
- accessibility,
- analytics,
- observability,
- tests,
- OpenAPI changes,
- migration/deployment notes,
- documentation updates.

---

## 45. Definition of Done — Backend Endpoint

A backend endpoint is complete only when relevant items are addressed:

- request validation,
- authentication,
- authorization,
- business/domain rules,
- transaction correctness,
- idempotency if needed,
- safe errors,
- logging/observability,
- OpenAPI contract,
- unit/domain tests,
- integration tests,
- abuse/rate-limit implications.

---

## 46. Definition of Done — Mobile Screen

A screen is complete only when relevant items are addressed:

- approved layout/behavior,
- design-system components,
- loading,
- empty,
- error,
- keyboard behavior,
- deep-link/navigation state,
- stale-data behavior,
- accessibility,
- large text,
- analytics,
- test coverage,
- server authorization assumptions are not trusted locally.

---

## 47. AI/Claude Authority

Claude Code may:
- inspect,
- analyze,
- plan,
- implement within approved scope,
- write tests,
- refactor locally within scope,
- run approved checks,
- review diffs,
- suggest architecture changes.

Claude Code may **not autonomously**:
- redefine product strategy,
- change safety policy,
- change privacy policy,
- replace the approved architecture,
- install high-risk dependencies,
- access production PII,
- read production secrets,
- run Terraform apply/destroy,
- deploy production,
- delete production data,
- execute production migrations,
- force-push protected branches,
- disable security controls,
- bypass permissions.

Never use dangerous permission-bypass modes as normal workflow.

---

## 48. Human Escalation Triggers

Stop and request explicit approval before implementation if the change introduces or materially changes:

- sensitive user attributes,
- age/minor handling,
- dating consent,
- moderation policy,
- exact/location-sharing behavior,
- government identity verification,
- payment/money movement,
- retention/deletion rules,
- new production cloud/vendor,
- new runtime/database,
- new architectural pattern,
- high-risk dependency,
- production data access.

---

## 49. Working Communication Standard

For non-trivial tasks, before implementation report:

### What I found
Relevant code/specification facts.

### Rules that apply
Relevant business rule, safety constraint, or ADR.

### Plan
Small ordered implementation plan.

### Expected files
Which files/modules are likely to change.

### Risks
Security, privacy, migration, concurrency, or compatibility concerns.

After implementation report:

### Implemented
What changed.

### Validation performed
Exact commands/tests actually run.

### Security/privacy/safety
What was checked.

### Remaining limitations
Anything not verified or intentionally deferred.

Never report success for work that was not actually executed or verified.

---

## 50. Engineering Values

Project Connect engineering favors:

- explicit over magical,
- simple over fashionable,
- safe over clever,
- measured over assumed,
- typed over implicit,
- validated over trusted,
- tested over hopeful,
- documented over tribal knowledge,
- reversible over irreversible,
- least privilege over convenience,
- user control over manipulation,
- production-quality foundations over prototype shortcuts.

“World-class” does **not** mean maximal complexity.

It means:
- clear requirements,
- controlled boundaries,
- predictable failure behavior,
- explicit permissions,
- minimized sensitive data,
- tested invariants,
- reviewable changes,
- observable systems,
- reversible decisions.

---

## 51. V1 Build Philosophy

We are not building a disposable prototype.

We are also not building infrastructure for an imaginary billion-user company.

The target is:

> **Production-grade foundations with startup-level operational simplicity.**

Build vertical slices, not enormous layers of unfinished scaffolding.

Recommended order:

```text
Engineering foundation
→ Identity / OTP
→ Profile
→ Discovery
→ Connection request / acceptance
→ Messaging
→ Block / report / moderation
→ Events
→ Subscription
→ Operational hardening
```

---

## 52. Master Rule

If there is a choice between:

> doing the task faster

and

> preserving Project Connect’s safety, privacy, authorization, architecture, or data integrity,

preserve the latter.

If uncertainty affects user harm, privacy, money, identity, or production data:

**stop, surface the uncertainty, and request approval.**
