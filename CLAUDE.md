# Project Connect — CLAUDE.md

> **Always-on engineering contract for Claude Code**
>
> Detailed product, architecture, safety, design, analytics and operational requirements live under `docs/`.
> This root file defines the rules Claude must always remember. Read the relevant canonical document before non-trivial implementation.

---

## 1. Mission

Project Connect is an **18+ verified Indian-diaspora connection platform** for friendship, activities, community events, professional networking and explicitly opt-in dating.

It is not:
- a generic chat application,
- a matrimony portal,
- a public social feed,
- a global people-search engine,
- or a swipe-first hookup product.

Core flow:

**Location + Intent + Interests + Trust → Relevant Discovery → Mutual Connection → Safe Conversation → Ongoing / Real-World Relationship**

Initial launch market: **Dallas–Fort Worth**.

---

## 2. Engineering Priority

When concerns conflict, use:

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
13. Implementation speed

Never weaken a higher-priority concern to make implementation easier.

---

## 3. Canonical Documentation by Domain

Use the **most specific approved authority for the topic**.

| Topic | Canonical authority |
|---|---|
| Product scope / V1 intent | Product Requirements Document |
| Screen/user interaction | Screen-by-Screen Functional Specification |
| Business states / eligibility | Business Rules Catalog |
| Data structure | Data Model / Data Dictionary |
| Authorization | Authorization Specification |
| Trust & Safety | Trust & Safety Specification |
| Notifications | Notification Specification |
| Analytics event taxonomy / KPI formulas | Analytics Specification |
| Visual system / accessibility | Design System |
| Technical architecture | Accepted ADRs |
| Claude operating behavior | `CLAUDE.md` + Engineering Constitution |

### Specificity rule

When two approved documents address the same subject, the document explicitly canonical for that domain governs that subject.

### Architecture authority

Accepted ADRs are authoritative for architecture. Product/business documents define **what the system must do** but do not silently supersede an accepted ADR describing **how the system is built**.

If a requirement cannot fit an accepted ADR, stop and propose a superseding ADR.

### Existing code

Existing code is not authoritative merely because it exists.

---

## 4. Known Governance Resolutions

`docs/architecture/GOVERNANCE-RESOLUTIONS-V1.1.md` resolves known cross-document conflicts.

Treat those resolutions as authoritative amendments until the underlying documents are formally revised.

Important resolutions include:

- Analytics Specification owns canonical analytics event names.
- ADR-008 owns messaging write architecture: REST persists; WebSocket delivers.
- Consumer API prefix is `/api/v1`.
- Admin API prefix is `/admin/v1`.
- Staff MFA is mandatory.
- Meaningful Connection requires reciprocal persisted messaging within 7 days of connection acceptance.
- Primary North Star is Weekly Meaningful Connections Created.
- Meaningful Connections / WAU is the normalized network-health metric.
- Activation requires a connection request **sent** or event RSVP; accepting a request alone does not satisfy the action condition.
- Support Agent, session storage, restrictions, appeals and notification-delivery persistence are approved model additions.
- `main` is the canonical Git branch.
- Native Windows development is supported; WSL is optional.
- Accepted ADR Pack numbering is canonical if older architecture text differs.

---

## 5. Frozen V1 Architecture

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
- modular monolith
- REST + JSON
- OpenAPI 3.1
- WebSocket / Socket.IO for realtime delivery

### Data
- PostgreSQL + PostGIS
- Drizzle ORM as persistence tooling
- parameterized raw SQL allowed for justified PostGIS/performance cases
- Redis only for ephemeral/cache/rate-limit/realtime coordination

### Async / scheduling
- Amazon SQS
- transactional outbox
- idempotent workers
- Amazon EventBridge Scheduler where scheduled jobs/reminders are appropriate

### AWS
- ECS Fargate
- RDS PostgreSQL
- ElastiCache Redis
- S3
- CloudFront
- WAF
- Secrets Manager
- KMS
- CloudWatch

### Providers / tooling
- Twilio Verify
- RevenueCat
- Firebase Cloud Messaging through `PushProvider`
- PostHog
- Sentry
- OpenTelemetry
- pluggable identity-verification provider
- Vitest
- Maestro for critical mobile E2E

### Admin
- Next.js
- separate staff authentication/security boundary
- mandatory staff MFA

### Engineering
- pnpm workspaces
- Turborepo
- Terraform
- GitHub Actions
- EAS

Technology substitutions require an ADR.

---

## 6. Explicitly Not Approved for V1

Do not introduce without an approved superseding ADR:

- microservices,
- Kubernetes / EKS,
- GraphQL,
- Kafka,
- MongoDB as a core datastore,
- DynamoDB as primary datastore,
- Firebase as primary backend/database,
- Elasticsearch / OpenSearch,
- event sourcing,
- heavy CQRS frameworks,
- ML/vector-database recommender systems,
- background continuous GPS,
- global arbitrary people search,
- contact-book ingestion for growth,
- custom auth platform,
- custom app-store billing platform.

FCM as a push transport does **not** violate the Firebase-primary-backend prohibition.

---

## 7. Approval Boundary

Claude may inspect, reason, edit approved-scope source files and run explicitly safe validation commands.

### Human approval is required before:
- **any package installation, removal or dependency upgrade**,
- material lockfile changes caused by dependency changes,
- production-impacting migration creation,
- network calls to external services unless explicitly approved as safe/read-only,
- destructive file operations,
- cloud mutation,
- Terraform apply/destroy,
- deployment,
- protected-branch push,
- secret access,
- production-data access,
- production migration execution.

Do not bypass this by invoking another shell/tool indirectly.

Never use dangerous permission-bypass mode as normal Project Connect workflow.

---

## 8. Secret and Sensitive-Data Boundary

Do not read or expose:
- `.env` (at any depth),
- environment files such as `.env.local`, `.env.*.local`, `.env.development`, `.env.staging`, `.env.production`, `.env.test` (`.env.example` is the safe template and is readable),
- credential files,
- private keys/certificates,
- secrets directories,
- production secret exports,
- production PII datasets,

unless the user explicitly authorizes access for a specific task.

Use `.env.example` or safe placeholders for engineering work.

Never print secret values into chat, logs, tests or diffs.

---

## 9. Repository Boundaries

Expected structure:

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
- applications do not import internals from other applications;
- mobile never imports backend source;
- admin consumes APIs/contracts rather than DB internals;
- shared packages have narrow coherent responsibilities;
- do not create dumping-ground `common` / `utils` packages;
- `packages/ui` consumes `packages/design-tokens`; do not duplicate a second token system.

---

## 10. Backend Dependency Direction

Each domain follows, conceptually:

```text
api/
application/
domain/
infrastructure/
```

Dependency direction:

```text
API → Application → Domain
                  ↑
       Infrastructure implements ports
```

Domain must not depend on:
- NestJS,
- Drizzle/ORM models,
- AWS SDK,
- Redis,
- HTTP objects,
- provider SDKs.

Controllers:
- validate transport input,
- use authenticated actor context,
- call application services,
- map explicit DTOs.

Controllers must not:
- contain core business rules,
- perform SQL,
- calculate authorization,
- access ORM directly,
- implement ranking,
- calculate premium entitlement.

One domain must not directly mutate another domain’s persistence tables.

---

## 11. TypeScript and Validation

All TypeScript is strict.

Avoid:
- `any`,
- routine `@ts-ignore`,
- unchecked casts,
- non-null assertions hiding uncertainty.

Use:
- `unknown` at unsafe boundaries,
- Zod/runtime validation,
- discriminated unions,
- exhaustive switches,
- explicit domain types.

Validate external/untrusted:
- HTTP input,
- webhooks,
- configuration,
- deep-link parameters,
- provider payloads when needed,
- user input.

Client validation improves UX. Server validation protects the system.

---

## 12. API Contract

Canonical prefixes:

```text
Consumer: /api/v1/*
Admin:    /admin/v1/*
```

Canonical connection acceptance example:

```text
POST /api/v1/connections/requests/{id}/accept
```

Rules:
- REST is canonical;
- OpenAPI represents externally visible APIs;
- actor identity comes from authenticated server context;
- every resource ID receives object-level authorization;
- explicit DTOs only;
- no ORM entity serialization;
- cursor pagination for unbounded lists;
- idempotency for retry-sensitive mutations;
- stable domain error codes;
- do not leak infrastructure/internal authorization details.

---

## 13. Privacy Projection

Consumer-facing responses must not expose:
- raw DOB,
- phone,
- email,
- exact coordinates,
- moderation/report history,
- raw verification artifacts,
- private safety state,
- internal risk scores,
- private dating preference internals.

Consumer location projection is limited to:
- approved city/metro context,
- approved rounded distance.

Current/live neighborhood is not a default V1 public field.

No continuous/background location history.

Profile-visitor insights are **not approved for V1**.

---

## 14. Trust & Safety Invariants

Non-negotiable unless policy is formally revised:

- 18+ only;
- no anonymous chat;
- no stranger direct messaging;
- accepted connection required for normal messaging;
- dating requires explicit opt-in;
- dating opt-in is not sexual consent;
- event attendance is not contact/dating consent;
- block acts immediately;
- block has system-wide precedence;
- reports/blocks remain free;
- reporter identity is confidential;
- verification is not a safety guarantee;
- exact location is never public;
- moderators get scoped evidence only;
- premium never overrides consent, block, privacy or moderation.

Stale UI, cached data, deep links or open WebSockets must not bypass block/restriction state.

---

## 15. Canonical State Clarifications

### Connection request
Persistent lifecycle:

```text
PENDING
ACCEPTED
DECLINED
EXPIRED
CANCELLED
INVALIDATED
```

A block invalidates an affected pending request with an internal reason such as `BLOCK`; `BLOCKED` is not the normal request lifecycle state.

### Event RSVP
Persistent states:

```text
GOING
WAITLISTED
CANCELLED
```

“Not Going” is a UI condition, not a separate persisted RSVP state.

---

## 16. Authentication and Authorization

Phone OTP verifies possession of a phone number. Project Connect owns account/session authorization.

Requirements:
- short-lived access tokens,
- high-entropy refresh tokens,
- hash refresh tokens server-side,
- rotate and revoke sessions,
- detect replay/reuse,
- SecureStore on mobile,
- never log OTP/token values,
- separate staff auth,
- mandatory staff MFA.

Authorization uses:

**RBAC + ABAC + ownership/relationship policy**

Typical evaluation:

1. authentication
2. account status
3. safety restrictions
4. block relationship
5. ownership/participation
6. context eligibility
7. entitlement
8. feature flag
9. action-specific rule

Fail closed.

---

## 17. Approved Data-Model Additions

Implementation may add, with normal schema review:

### `user_sessions`
For refresh rotation, revocation, token-family/replay controls.

### `user_restrictions`
Capability-oriented restrictions such as:
- DISCOVER
- BE_DISCOVERED
- SEND_REQUESTS
- RECEIVE_REQUESTS
- MESSAGE
- RSVP
- USE_DATING

Avoid scattering permanent boolean restriction columns across `users`.

### `moderation_appeals`
For appeal submission/status/review/resolution.

### `notification_deliveries`
For per-channel attempt/result state.

Notification preferences may include:
- quiet-hours enabled/start/end,
- timezone,
- privacy-safe message-preview preference.

`SUPPORT_AGENT` is an approved staff role.

Detailed schema still requires a migration plan and review.

---

## 18. Database and Transactions

PostgreSQL/PostGIS is authoritative.

Redis is never the sole source of truth for:
- users,
- connections,
- blocks,
- messages,
- reports,
- subscriptions/entitlements.

Rules:
- migrations only,
- no manual production schema edits,
- preserve constraints,
- parameterize raw SQL,
- avoid N+1,
- justify material indexes,
- review critical query plans,
- destructive changes use expand-contract.

Critical atomic operations include:
- connection acceptance,
- block,
- RSVP capacity/waitlist transitions,
- billing entitlement mutation.

Do not leave partial relationship state.

---

## 19. Messaging Architecture

ADR-008 governs messaging writes.

Canonical flow:

```text
POST /api/v1/conversations/{id}/messages
→ authenticate
→ authorize
→ re-check block/restrictions
→ validate
→ persist PostgreSQL
→ write outbox
→ commit
→ realtime publish
→ WebSocket delivery
→ push fallback if appropriate
```

WebSocket is delivery transport, **not** the sole durable write path.

---

## 20. Mobile State

TanStack Query owns server state.

Zustand is limited to transient/local state such as:
- onboarding draft,
- temporary filters,
- modal/UI coordination,
- safe preferences.

Never mirror the backend DB into Zustand.

Use centralized/generated API client.

Credentials use SecureStore.

Client eligibility is never final authorization.

---

## 21. Analytics Canonicalization

The Analytics Specification is authoritative for event names and KPI formulas.

Do not emit legacy/general-document aliases in parallel.

Canonical replacements include:

```text
event_rsvp              → event_rsvp_created
event_cancel_rsvp       → event_rsvp_cancelled
chat_opened             → conversation_opened
subscription_viewed     → paywall_viewed
phone_verified          → otp_verified
age_gate_passed/failed  → age_gate_completed + eligible property
notification_push_attempted → push_attempted
```

Do not use vague generic events such as `screen_viewed` or `cta_tapped` as substitutes for canonical product events.

Analytics never receives:
- names,
- phone,
- email,
- DOB,
- exact coordinates,
- OTPs/tokens,
- message bodies,
- report free text,
- moderator notes,
- verification images.

---

## 22. Canonical Product Metrics

### Meaningful Connection
Count once when:
1. connection is accepted;
2. one participant sends a persisted message;
3. the other sends a persisted reciprocal message;
4. reciprocal exchange occurs within **7 days of connection acceptance**.

Event:

```text
meaningful_connection_created
```

### Primary North Star
**Weekly Meaningful Connections Created**

### Normalized network-health KPI
**Meaningful Connections / WAU**

### Sustained Conversation
Separate metric: at least 10 total messages involving both users within 7 days.

### Activation
Requires:
1. registration complete,
2. phone verified,
3. profile completeness >=70%,
4. >=1 intent,
5. >=3 interests,
6. discovery viewed,
7. at least one connection request **sent** OR event RSVP created.

Accepting an incoming request alone does not satisfy item 7.

---

## 23. Notifications and Marketing

Notification Specification governs communication behavior.

Push is best-effort transport; durable domain/in-app state remains authoritative where specified.

Marketing:
- requires affirmative consent,
- remains fully revocable/opt-out,
- must not be sent before consent.

Push failure never rolls back a committed domain action.

Deep links always re-authorize.

---

## 24. Design / Accessibility

Use semantic design tokens and approved shared UI components.

`packages/ui` consumes `packages/design-tokens`.

Do not:
- hard-code arbitrary brand colors,
- fork a second design system,
- create a second token tree,
- install another icon library casually,
- make swipe-only discovery the core experience,
- create public premium-status prestige badges.

Accessibility is Definition of Done:
- names/roles/states,
- text scaling,
- touch targets,
- contrast,
- focus/keyboard behavior where relevant,
- non-color-only status.

---

## 25. External Providers and Async Work

Provider implementations stay behind interfaces such as:
- `PhoneVerificationProvider`
- `PushProvider`
- `SubscriptionProvider`
- `IdentityVerificationProvider`
- `AnalyticsProvider`
- `MediaModerationProvider`

Outbound calls require:
- explicit timeout,
- classified retries,
- safe error translation,
- observability.

Durable sequence:

```text
Validate → Authorize → Persist → Commit → Publish → Deliver side effects
```

Critical async work uses transactional outbox.

SQS consumers are idempotent.

---

## 26. Dependencies

Before proposing a dependency:
- explain the problem,
- check approved/platform capabilities,
- assess maintenance/security/license,
- assess runtime/bundle/native impact,
- explain why it is necessary.

**Any package install/remove/upgrade requires human approval.**

Do not alter lockfiles through dependency changes without approval.

---

## 27. Infrastructure / Secrets

Infrastructure is Terraform-managed.

Production:
- RDS/Redis private,
- least-privilege IAM,
- Secrets Manager/KMS,
- no secrets in repository/Terraform literals,
- human-controlled deployment and cloud mutation.

Do not introduce Kubernetes.

Do not perform routine ClickOps.

Never autonomously:
- read production secrets,
- query production PII,
- run Terraform apply/destroy,
- deploy production,
- execute production migrations,
- delete production data.

---

## 28. Testing

Test behavior/invariants.

Critical tests include where relevant:
- stranger cannot message,
- block prevents messaging/discovery and survives stale state,
- dating opt-out removes dating eligibility,
- premium cannot bypass safety,
- suspended/banned user cannot interact,
- IDOR fails,
- entitlement spoof fails,
- duplicate/retry mutation is idempotent,
- event capacity cannot overbook,
- safety action racing social action resolves safely.

Integration tests use real PostgreSQL/PostGIS behavior.

Do not weaken tests, constraints, validation or authorization to make implementation pass.

---

## 29. Non-Trivial Work Procedure

Before editing:

### What I found
Relevant code/spec facts.

### Governing rules
Requirements / business rules / ADRs / safety / privacy.

### Plan
Small ordered implementation plan.

### Files/modules
Expected changes.

### Risks
Security/privacy/data/concurrency/migration/compatibility.

Then implement the smallest coherent vertical change.

After implementation:
- inspect `git status`,
- inspect complete diff,
- run applicable formatting/lint/typecheck/tests,
- run architecture/security review when appropriate,
- report exactly what was and was not verified.

Never claim checks passed unless actually run.

---

## 30. Architecture Change Protocol

If an approved requirement cannot fit the architecture, do not silently deviate.

Provide:
- Problem
- Evidence
- Affected ADR(s)
- Alternatives
- Recommendation
- Risks
- Migration impact
- Reversal plan
- Proposed superseding ADR

Wait for approval.

---

## 31. Definition of Done

Code compiling is not Done.

Where relevant, Done includes:
- approved behavior,
- server validation,
- authorization,
- privacy,
- safety,
- transaction integrity,
- loading/empty/error/unavailable states,
- accessibility,
- analytics,
- notifications,
- observability,
- tests,
- OpenAPI,
- migration/deployment notes,
- documentation.

---

## 32. Claude Authority

Claude may:
- inspect,
- analyze,
- plan,
- implement within approved scope,
- write tests,
- run explicitly safe checks,
- review diffs,
- suggest changes.

Claude may not autonomously:
- change product/safety/privacy policy,
- replace architecture,
- install/remove/upgrade packages,
- access secrets/production PII,
- mutate production/cloud,
- deploy production,
- execute production migrations,
- force-push protected branches,
- disable security controls.

---

## 33. Master Rule

If speed conflicts with Project Connect safety, security, privacy, authorization, architecture or data integrity, preserve the latter.

When uncertainty materially affects user harm, identity, money, privacy or production data:

**stop, explain the uncertainty and request approval.**
