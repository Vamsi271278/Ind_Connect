# V1 ARCHITECTURE DECISION RECORDS — ADR PACK

## Product
**Project Connect**

## Version
**V1.0**

## Status
**Approved Architecture Baseline**

## Purpose

This ADR pack converts the approved System Architecture into explicit, durable technical decisions.

Each ADR contains:

- context;
- decision;
- rationale;
- alternatives considered;
- why alternatives were rejected;
- consequences;
- risks;
- mitigations;
- reversal conditions;
- implementation rules;
- Claude Code constraints.

These ADRs are authoritative unless superseded by a later ADR.

---

# ADR GOVERNANCE

## Status Values

```text
PROPOSED
ACCEPTED
SUPERSEDED
DEPRECATED
REJECTED
```

All ADRs in this V1 pack are:

**ACCEPTED**

---

## Change Rule

An accepted ADR may be changed only through:

1. new problem statement;
2. measurable evidence;
3. alternative analysis;
4. migration impact;
5. risk analysis;
6. replacement ADR.

Do not edit history to make the old decision appear as though it never existed.

---

# ADR-001 — REACT NATIVE + EXPO

## Status
ACCEPTED

## Context

Project Connect requires:

- iOS;
- Android;
- rapid iteration;
- shared business logic;
- strong native capabilities;
- camera;
- notifications;
- deep linking;
- secure storage;
- app-store subscriptions;
- image upload;
- future realtime/video capability.

The initial engineering organization is expected to remain relatively small.

Maintaining two independent native teams would materially slow launch.

---

## Decision

Use:

```text
React Native
+
Expo
+
TypeScript
```

as the primary consumer mobile platform.

Use the latest stable production-compatible Expo SDK at project bootstrap.

---

## Rationale

This combination provides:

- one primary mobile codebase;
- native iOS/Android deployment;
- mature ecosystem;
- efficient OTA-compatible JavaScript updates;
- strong developer tooling;
- practical access to native SDKs;
- reduced staffing requirements;
- strong compatibility with Claude-assisted development.

---

## Alternatives Considered

### Native Swift + Kotlin

Advantages:

- maximum platform control;
- best access to bleeding-edge native APIs.

Rejected for V1 because:

- two implementations;
- duplicated QA;
- slower iteration;
- larger engineering cost.

---

### Flutter

Advantages:

- excellent cross-platform rendering;
- strong performance.

Rejected because:

- additional Dart skill requirement;
- React/TypeScript ecosystem aligns better with planned web/admin/backend stack;
- less shared language across product surface.

---

### PWA / Mobile Web

Rejected because Project Connect requires stronger support for:

- push;
- camera;
- secure storage;
- app-store billing;
- native UX;
- deep links.

---

## Consequences

Positive:

- shared mobile codebase;
- faster feature delivery;
- common TypeScript talent pool.

Negative:

- some advanced native features may require custom native modules;
- Expo SDK upgrade discipline is required.

---

## Risks

- dependency incompatibility;
- native module limitations;
- delayed support for newest OS capabilities.

---

## Mitigation

- stay current with Expo;
- avoid obscure native libraries;
- isolate provider integrations;
- use Expo development builds when custom native code is required.

---

## Reversal Conditions

Reconsider only if:

- essential product capability cannot be delivered reliably;
- severe performance limitation is proven;
- product requires deeply platform-specific behavior;
- native-team scale makes independent apps strategically superior.

---

## Implementation Rules

- no unmanaged ad-hoc native code;
- no dependency added without compatibility review;
- app features must use approved shared design system;
- business logic should remain outside UI components.

---

## Claude Code Constraints

Claude Code may not:

- eject from Expo casually;
- introduce Flutter/native app alternative;
- add unsupported native libraries without justification;
- duplicate iOS/Android business logic unnecessarily.

---

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

---

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

---

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

---

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

---

# ADR-006 — ECS FARGATE COMPUTE

## Status
ACCEPTED

## Decision

Run backend containers on:

**Amazon ECS Fargate**

---

## Rationale

Provides:

- managed container execution;
- autoscaling;
- no server management;
- no Kubernetes cluster management.

---

## Alternatives

### Kubernetes / EKS

Rejected due operational complexity.

### Lambda

Rejected as primary backend because of:

- WebSocket/realtime considerations;
- persistent service structure;
- simpler monolithic container deployment.

---

## Risks

Higher unit compute cost than aggressively optimized EC2.

---

## Mitigation

Accept higher early-stage unit cost in exchange for operational simplicity.

---

## Reversal Conditions

Reassess if:

- sustained high compute cost;
- container scheduling needs become complex;
- platform team becomes large enough to justify Kubernetes.

---

# ADR-007 — REDIS FOR EPHEMERAL STATE

## Status
ACCEPTED

## Decision

Use managed Redis for:

- rate limits;
- presence;
- temporary cache;
- WebSocket coordination;
- idempotency;
- ephemeral counters.

---

## Critical Rule

Redis is not the authoritative store for:

- messages;
- connections;
- subscription status;
- moderation records;
- blocks.

---

## Alternatives

### PostgreSQL Only

Rejected because high-frequency ephemeral state would create unnecessary DB load.

---

## Risk

Redis outage.

---

## Mitigation

Design features so Redis loss causes:

- degraded presence;
- reduced cache;
- controlled rate-limit fallback

not data loss.

---

# ADR-008 — REST WRITE + WEBSOCKET DELIVERY FOR MESSAGING

## Status
ACCEPTED

## Decision

Message creation uses REST.

Realtime delivery uses WebSocket/Socket.IO.

---

## Canonical Flow

```text
REST POST
↓
Authorize
↓
Persist PostgreSQL
↓
Commit
↓
Outbox
↓
Realtime publish
↓
Push if recipient offline
```

---

## Rationale

This separates:

**durability**

from:

**realtime transport.**

---

## Alternatives

### WebSocket-Only Messaging

Rejected because:

- retry semantics are harder;
- idempotency less obvious;
- error handling harder;
- durable transaction coupling becomes fragile.

---

## Reversal Conditions

None anticipated for V1.

---

# ADR-009 — PHONE AUTH + TWILIO VERIFY

## Status
ACCEPTED

## Decision

Phone verification is mandatory.

Use Twilio Verify as SMS verification provider.

Project Connect owns application sessions.

---

## Rationale

Phone identity reduces:

- fake account friction;
- account duplication;
- anonymous abuse.

Twilio reduces commodity OTP engineering.

---

## Important Boundary

Twilio confirms:

**possession of phone**

not:

**identity safety**

and not:

**account authorization.**

---

## Alternatives

### Firebase Authentication

Rejected as primary auth authority because we want Project Connect session/security control.

### Custom SMS OTP

Rejected due fraud, delivery, and operational complexity.

---

## Risks

- SMS fraud;
- SIM swap;
- provider dependency;
- OTP cost.

---

## Mitigation

- rate limits;
- device/IP signals;
- risk detection;
- short OTP lifetime;
- refresh token security.

---

# ADR-010 — REVENUECAT FOR MOBILE SUBSCRIPTIONS

## Status
ACCEPTED

## Decision

Use RevenueCat to abstract Apple and Google subscriptions.

Backend mirrors authoritative product entitlements.

---

## Rationale

Reduces complexity around:

- receipts;
- renewals;
- grace periods;
- platform differences.

---

## Alternatives

### Direct Apple + Google Integration

Technically possible but increases billing engineering and reconciliation complexity.

Rejected for V1.

---

## Critical Rule

RevenueCat client state does not authorize premium APIs.

Backend entitlement does.

---

## Reversal Conditions

Consider direct store integration only if:

- vendor cost becomes material;
- custom billing workflows demand it;
- scale justifies ownership.

---

# ADR-011 — S3 + CLOUDFRONT FOR MEDIA

## Status
ACCEPTED

## Decision

Use S3 for media objects and CloudFront for delivery.

Clients upload directly using presigned URLs.

---

## Rationale

Efficient for:

- profile images;
- event imagery;
- future message images.

---

## Security Requirements

- random keys;
- validation;
- metadata stripping;
- moderation;
- private verification bucket;
- lifecycle deletion.

---

## Alternatives

### Database Binary Storage

Rejected.

### API-Proxy Uploads

Rejected for normal image payload due unnecessary bandwidth and scaling cost.

---

# ADR-012 — SQS + TRANSACTIONAL OUTBOX

## Status
ACCEPTED

## Decision

Use:

- PostgreSQL transactional outbox;
- Amazon SQS;
- idempotent workers.

---

## Rationale

Critical business transactions often require async side effects.

Example:

Connection acceptance should not fail because push provider is down.

---

## Flow

```text
Business Transaction
+
Outbox Record
↓
Commit
↓
Publisher
↓
SQS
↓
Consumer
```

---

## Alternatives

### Direct synchronous provider calls

Rejected due coupling and inconsistent failure states.

### Kafka

Rejected as unnecessary V1 infrastructure.

---

## Delivery Guarantee

Assume:

**at least once**

Consumers must be idempotent.

---

# ADR-013 — TANSTACK QUERY FOR SERVER STATE

## Status
ACCEPTED

## Decision

Use TanStack Query as mobile/admin server-state manager.

---

## Covers

- discovery;
- profiles;
- events;
- connections;
- messages metadata;
- notifications;
- subscription state.

---

## Rationale

Provides:

- cache;
- invalidation;
- loading states;
- retries;
- request dedupe.

---

## Critical Boundary

TanStack Query cache is not authoritative business state.

---

# ADR-014 — ZUSTAND ONLY FOR LOCAL UI STATE

## Status
ACCEPTED

## Decision

Use Zustand sparingly.

Examples:

- temporary filters;
- onboarding UI draft;
- modal coordination;
- UI preferences.

---

## Rejected Pattern

Do not build a giant global store containing all server objects.

---

## Alternatives

### Redux Toolkit

Powerful, but unnecessary complexity given TanStack Query.

---

# ADR-015 — MONOREPO WITH PNPM + TURBOREPO

## Status
ACCEPTED

## Decision

Use one repository for:

- mobile;
- admin;
- API;
- workers;
- shared packages;
- infrastructure.

Use:

- pnpm workspaces;
- Turborepo.

---

## Rationale

Supports:

- shared types;
- common validation;
- single CI;
- consistent tooling;
- easier Claude context.

---

## Risks

Accidental coupling.

---

## Mitigation

Workspace boundaries and lint rules.

---

## Reversal Conditions

Split repositories only when team/org boundaries justify independent ownership.

---

# ADR-016 — TERRAFORM FOR INFRASTRUCTURE

## Status
ACCEPTED

## Decision

All production infrastructure managed through Terraform.

---

## Rationale

Provides:

- repeatability;
- reviewable changes;
- environment parity;
- disaster recovery support.

---

## Rejected

Manual AWS console configuration.

---

## Rule

Emergency console changes must be reconciled back to Terraform immediately.

---

# ADR-017 — GITHUB ACTIONS CI/CD

## Status
ACCEPTED

## Decision

Use GitHub Actions for:

- validation;
- testing;
- image builds;
- infrastructure plans;
- deployment orchestration.

EAS handles mobile build/release execution.

---

## Mandatory PR Pipeline

```text
format
lint
typecheck
unit
integration
contract
security
migration validation
```

---

## Production Rules

Production deployment must originate from CI.

Not developer laptop.

---

# ADR-018 — POSTHOG FOR PRODUCT ANALYTICS

## Status
ACCEPTED

## Decision

Use PostHog for V1 product analytics and experimentation.

---

## Privacy Position

Do not send:

- names;
- phone;
- email;
- DOB;
- exact location;
- message content;
- report text;
- dating-preference detail beyond approved aggregate codes.

Session replay:

**disabled by default.**

---

## Alternatives

### Amplitude

Strong option.

Rejected only to avoid multiple overlapping analytics platforms.

### Mixpanel

Also viable.

---

## Reversal Conditions

Change if:

- privacy model becomes incompatible;
- scale/cost becomes material;
- advanced warehouse-first analytics strategy emerges.

---

# ADR-019 — SENTRY + CLOUDWATCH + OPENTELEMETRY

## Status
ACCEPTED

## Decision

Use:

```text
Sentry
CloudWatch
OpenTelemetry
```

for observability.

---

## Responsibility

Sentry:
- application errors;
- mobile crashes;
- release health.

CloudWatch:
- infrastructure/logs/alarms.

OpenTelemetry:
- vendor-neutral traces/metrics instrumentation.

---

## Rule

No private-message body or sensitive payload enters telemetry.

---

# ADR-020 — SECURITY ARCHITECTURE

## Status
ACCEPTED

## Decision

Project Connect adopts:

**defense in depth**

rather than relying on any single control.

Layers:

```text
WAF
↓
Rate Limits
↓
Authentication
↓
Authorization
↓
Domain Validation
↓
Data Projection
↓
Database Constraints
↓
Audit
↓
Monitoring
```

---

## Key Requirements

- short-lived access tokens;
- refresh-token rotation;
- staff MFA;
- admin isolation;
- secrets manager;
- KMS encryption;
- private DB/Redis;
- object-level authorization;
- IDOR testing;
- restricted PII.

---

## Fail Policy

Authorization:

**fail closed**

Analytics:

**fail open**

Push:

**fail open after durable state**

---

# ADR-021 — DATA PRIVACY ARCHITECTURE

## Status
ACCEPTED

## Decision

Privacy is enforced structurally, not only through UI.

---

## Core Rules

- exact user coordinates never reach consumer client;
- phone/email excluded from public profile DTO;
- DOB never exposed;
- dating preferences sensitive;
- location history not retained by default;
- private verification media isolated;
- deletion orchestrated across domains.

---

## Profile Projection

Every other-user response passes through:

```text
ProfileProjectionService
```

---

## Principle

> Data not needed by a consumer must not be sent to the consumer.

---

# ADR-022 — NO MICROservices V1

## Status
ACCEPTED

## Decision

Explicit prohibition unless superseding ADR approved.

---

## Why Separate ADR Exists

Because AI-assisted coding commonly over-engineers.

This ADR intentionally prevents accidental service sprawl.

---

## Do Not Create

- profile-service deployment;
- event-service deployment;
- user-service deployment;
- auth-service deployment

as independent containers merely because domains are logically separate.

---

# ADR-023 — NO KUBERNETES V1

## Status
ACCEPTED

## Decision

No Kubernetes/EKS V1.

---

## Reversal Condition

Only when operational scale/team complexity provides measurable benefit.

"Industry standard" is not a valid reason.

---

# ADR-024 — NO GRAPHQL V1

## Status
ACCEPTED

No GraphQL endpoint unless replacement ADR accepted.

---

# ADR-025 — NO ML RECOMMENDER V1

## Status
ACCEPTED

## Decision

Use deterministic/configurable scoring.

---

## Why

At launch we lack sufficient trustworthy behavioral data.

A machine-learning model before real user data would mostly encode assumptions.

---

## Reversal Conditions

Reconsider after:

- sufficient interactions;
- stable north-star measurement;
- baseline recommendation performance;
- clear evaluation dataset.

---

# ADR-026 — DETERMINISTIC DISCOVERY PIPELINE

## Status
ACCEPTED

## Decision

Discovery architecture:

```text
Candidate Generation
→ Eligibility
→ Scoring
→ Diversification
→ Pagination
```

---

## Hard Rule

Eligibility occurs before ranking.

Ranking can never resurrect an ineligible profile.

---

## Ranking Inputs

Approved V1:

- intent compatibility;
- shared interests;
- distance;
- language;
- verification;
- profile completeness;
- recent activity.

---

# ADR-027 — CENTRALIZED AUTHORIZATION POLICIES

## Status
ACCEPTED

## Decision

Complex business authorization lives in central policy services.

---

## Examples

```text
canViewProfile()
canSendConnectionRequest()
canMessage()
canRSVP()
canUseDating()
```

---

## Rejected Pattern

Permission logic duplicated in:

- controllers;
- UI;
- repository queries.

---

# ADR-028 — DTO PROJECTION BOUNDARIES

## Status
ACCEPTED

## Decision

Never expose ORM/database entities directly.

Layers:

```text
Database Entity
→ Domain Model
→ Application Result
→ API DTO
```

---

## Required DTO Categories

```text
SelfProfileDto
PublicProfileDto
ConnectedProfileDto
ModeratorUserDto
SupportUserDto
```

---

# ADR-029 — DATABASE TRANSACTIONS FOR RELATIONSHIP STATE

## Status
ACCEPTED

## Decision

Critical state changes must be transactional.

Examples:

- accept connection;
- block user;
- RSVP capacity;
- entitlement processing.

---

## Example Connection Transaction

```text
lock request
validate
mark accepted
create connection
create conversation
create participants
write outbox
commit
```

No partial state allowed.

---

# ADR-030 — EXTERNAL PROVIDER ABSTRACTIONS

## Status
ACCEPTED

## Decision

External vendors must sit behind interfaces.

---

## Required Interfaces

```text
PhoneVerificationProvider
PushProvider
SubscriptionProvider
IdentityVerificationProvider
AnalyticsProvider
MediaModerationProvider
```

---

## Rationale

Reduces vendor lock-in and test complexity.

---

# ADR-031 — IDENTITY VERIFICATION PROVIDER NOT YET FROZEN

## Status
ACCEPTED

## Decision

The architecture freezes the interface, not vendor.

---

## Vendor Evaluation Requirements

Must review:

- liveness;
- false-positive rate;
- biometric retention;
- privacy;
- geographic coverage;
- SDK quality;
- pricing;
- support.

---

## Prohibited

Do not let Claude independently choose and tightly integrate a vendor before approval.

---

# ADR-032 — FEATURE FLAGS + REMOTE CONFIGURATION

## Status
ACCEPTED

## Decision

Use server-side feature flags and configuration.

---

## Feature Flags

Examples:

```text
dating_enabled
image_messaging_enabled
premium_enabled
attendee_discovery_enabled
```

---

## Remote Configuration

Examples:

```text
connection.daily_limit
request.expiry_days
ranking.weight.intent
```

---

## Rule

Safety-sensitive features need immediate server-side kill switch.

---

# ADR-033 — ADMIN APP AS SEPARATE SECURITY BOUNDARY

## Status
ACCEPTED

## Decision

Admin UI is separate from consumer app.

Separate:

- application;
- routes;
- authentication;
- authorization;
- session handling.

---

## Why

Administrative access includes:

- moderation;
- reports;
- events;
- account actions;
- PII.

It must not be hidden functionality inside consumer app.

---

# ADR-034 — NEXT.JS ADMIN WEB APPLICATION

## Status
ACCEPTED

## Decision

Use Next.js + React + TypeScript.

---

## Rationale

Strong ecosystem and consistent TypeScript stack.

Admin is primarily workflow/data management, not SEO-driven consumer product.

---

# ADR-035 — STAFF MFA MANDATORY

## Status
ACCEPTED

Any staff/admin production access requires MFA.

No exception for Super Admin.

---

# ADR-036 — TRANSACTIONAL LOGGING + CORRELATION IDS

## Status
ACCEPTED

Every incoming backend request receives correlation ID.

Propagate through:

- DB-adjacent logs;
- queue messages;
- workers;
- provider calls.

---

## Rule

Logs are structured JSON.

No production `console.log()` for application telemetry.

---

# ADR-037 — SECRETS MANAGER + KMS

## Status
ACCEPTED

Secrets live in AWS Secrets Manager.

Encryption keys managed through KMS.

---

## Prohibited

- committing `.env.production`;
- placing secrets in CLAUDE.md;
- embedding API secrets in mobile.

---

# ADR-038 — PRESIGNED DIRECT MEDIA UPLOADS

## Status
ACCEPTED

Mobile uploads directly to S3 using short-lived presigned authorization.

---

## Backend Responsibilities

Before signing:

- authenticate user;
- validate intended media type;
- enforce upload quota;
- generate safe object key.

After upload:

- media remains PENDING;
- moderation occurs before public use.

---

# ADR-039 — EXIF STRIPPING

## Status
ACCEPTED

Uploaded profile/event imagery must have sensitive EXIF metadata removed before delivery.

Especially GPS coordinates.

---

# ADR-040 — PRIVATE SAFETY/VERIFICATION STORAGE

## Status
ACCEPTED

Verification and high-sensitivity evidence must use storage isolated from ordinary public-facing media.

No public CDN access.

---

# ADR-041 — APP STORE SUBSCRIPTIONS ONLY FOR MOBILE DIGITAL ENTITLEMENTS

## Status
ACCEPTED

Mobile premium digital features follow current Apple/Google billing requirements.

Backend entitlements abstract store semantics.

---

## Event Tickets

Event-payment architecture remains a separate product/legal/payment decision.

Do not automatically route event tickets through subscription infrastructure.

---

# ADR-042 — ANALYTICS FAILURE MUST NOT BLOCK USER ACTION

## Status
ACCEPTED

If analytics provider fails:

- signup continues;
- request sends;
- report submits;
- payment state remains intact.

Analytics runs asynchronously/best effort.

---

# ADR-043 — PUSH FAILURE MUST NOT BLOCK DOMAIN TRANSACTION

## Status
ACCEPTED

A connection acceptance is successful even if push notification fails.

Durable in-app notification remains canonical.

---

# ADR-044 — SECURITY INVALIDATION OVERRIDES CACHE

## Status
ACCEPTED

Events requiring rapid invalidation:

- block;
- suspension;
- ban;
- role revocation.

Do not allow stale cache to continue authorization.

---

# ADR-045 — NO GLOBAL USER SEARCH V1

## Status
ACCEPTED

People discovery is recommendation/filter driven.

No arbitrary search by:

- full name;
- phone;
- email.

---

## Rationale

Reduces:

- stalking risk;
- scraping;
- privacy exposure.

---

# ADR-046 — CURSOR PAGINATION

## Status
ACCEPTED

Use cursor-based pagination for high-volume collections.

Avoid OFFSET.

---

# ADR-047 — VERSIONED DATABASE MIGRATIONS

## Status
ACCEPTED

All schema change uses migration files.

Production migrations run via dedicated deployment step.

---

## Prohibited

- manual production schema edits;
- application startup auto-migration.

---

# ADR-048 — EXPAND-CONTRACT SCHEMA CHANGES

## Status
ACCEPTED

Breaking changes use:

```text
expand
deploy compatible code
backfill
switch
contract later
```

---

# ADR-049 — NO PRODUCTION DATA IN NONPRODUCTION

## Status
ACCEPTED

Dev/staging use synthetic data.

Production PII may not be copied casually to lower environments.

---

# ADR-050 — TRUNK-BASED DEVELOPMENT

## Status
ACCEPTED

Use:

```text
main
+
short-lived branches
```

Avoid long-lived environment branches.

---

# ADR-051 — CODEOWNERS FOR HIGH-RISK DOMAINS

## Status
ACCEPTED

High-risk paths require specialist review.

Examples:

```text
auth/
authorization/
trust-safety/
billing/
migrations/
infrastructure/
```

---

# ADR-052 — AUTOMATED SECURITY SCANNING

## Status
ACCEPTED

CI includes:

- secret scanning;
- dependency scanning;
- static analysis;
- container scanning;
- infrastructure scanning.

---

# ADR-053 — REAL POSTGRESQL IN INTEGRATION TESTS

## Status
ACCEPTED

Critical backend integration tests run against actual PostgreSQL, with PostGIS where relevant.

No SQLite stand-in for database behavior.

---

# ADR-054 — MAESTRO MOBILE E2E

## Status
ACCEPTED

Use Maestro for primary mobile end-to-end flows unless proven inadequate.

---

# ADR-055 — SYNTHETIC SEED PERSONAS

## Status
ACCEPTED

Test environments include standardized seed users:

```text
active-social
active-dating
verified
unverified
blocked
suspended
premium
organizer
```

This supports deterministic QA and Claude testing.

---

# ADR-056 — DATA-DELETION ORCHESTRATOR

## Status
ACCEPTED

Account deletion is asynchronous and domain-aware.

Not one cascading SQL delete.

---

# ADR-057 — NO CONTINUOUS LOCATION HISTORY

## Status
ACCEPTED

Only current operational discovery location is stored by default.

---

# ADR-058 — APPROXIMATE DISTANCE ONLY TO CLIENT

## Status
ACCEPTED

Consumer client receives:

- city;
- optional rounded distance.

Never target latitude/longitude.

---

# ADR-059 — SAFETY FEATURES ARE NON-COMMERCIAL

## Status
ACCEPTED

Block, report, privacy controls are not governed by premium entitlement.

---

# ADR-060 — BLOCK HAS SYSTEM-WIDE PRECEDENCE

## Status
ACCEPTED

Block impacts:

- discovery;
- profile access;
- requests;
- connections;
- messaging;
- attendee discovery;
- relevant notifications.

---

# ADR-061 — DATING CONSENT AS VERSIONED RECORD

## Status
ACCEPTED

Dating consent stored with:

- user;
- timestamp;
- policy version;
- revocation timestamp.

---

# ADR-062 — PRODUCT CONFIGURATION IS NOT CODE CONSTANTS

## Status
ACCEPTED

Values such as:

- connection limits;
- ranking weights;
- cooldowns;
- distance limits

must be configuration-driven.

---

# ADR-063 — NO EVENT SOURCING V1

## Status
ACCEPTED

Transactional state remains canonical.

Outbox events are integration mechanisms only.

---

# ADR-064 — NO HEAVY CQRS FRAMEWORK V1

## Status
ACCEPTED

Use explicit command/query patterns when helpful, without complex framework overhead.

---

# ADR-065 — NO ELASTICSEARCH V1

## Status
ACCEPTED

PostgreSQL handles V1 search/filter workloads.

---

# ADR-066 — NO KAFKA V1

## Status
ACCEPTED

SQS satisfies async workload needs.

Kafka requires a proven high-throughput/event-streaming justification.

---

# ADR-067 — ONE PRIMARY PROGRAMMING LANGUAGE FAMILY

## Status
ACCEPTED

Use TypeScript across:

- mobile;
- admin;
- backend;
- workers.

Terraform remains infrastructure language.

---

## Benefit

Reduces cognitive load and improves shared tooling.

---

# ADR-068 — STRICT TYPESCRIPT

## Status
ACCEPTED

All TypeScript projects run:

```text
strict: true
```

---

## Prohibited

Routine:

```text
any
@ts-ignore
```

without documented reason.

---

# ADR-069 — ZOD FOR RUNTIME VALIDATION

## Status
ACCEPTED

Use Zod for:

- request DTO validation;
- config validation;
- client forms where appropriate.

---

## Critical Rule

TypeScript types alone are not runtime validation.

---

# ADR-070 — NO DIRECT ORM ACCESS FROM CONTROLLERS

## Status
ACCEPTED

Controllers call application services.

Application services use repositories.

---

# ADR-071 — DOMAIN LAYER FRAMEWORK INDEPENDENCE

## Status
ACCEPTED

Core domain logic should not import:

- NestJS decorators;
- AWS SDK;
- ORM objects.

---

# ADR-072 — OUTBOUND PROVIDER TIMEOUTS REQUIRED

## Status
ACCEPTED

Every external network call must have explicit timeout.

---

# ADR-073 — RETRIES REQUIRE CLASSIFICATION

## Status
ACCEPTED

Retry:

- transient network;
- 5xx where safe;
- throttling with backoff.

Do not retry:

- validation failures;
- invalid OTP;
- permanent provider errors.

---

# ADR-074 — DEAD LETTER QUEUES

## Status
ACCEPTED

Critical SQS queues require DLQ.

Especially:

- billing;
- deletion;
- safety;
- notifications.

---

# ADR-075 — HEALTH + READINESS ENDPOINTS

## Status
ACCEPTED

Provide:

```text
/health/live
/health/ready
```

Do not expose sensitive dependency details publicly.

---

# ADR-076 — MAINTENANCE + MINIMUM VERSION BOOTSTRAP

## Status
ACCEPTED

Mobile app bootstrap receives:

- maintenance status;
- minimum version;
- feature flags;
- user status.

Supports:

- hard security updates;
- controlled outages;
- emergency feature shutdown.

---

# ADR-077 — PRODUCTION INFRASTRUCTURE MULTI-AZ, NOT MULTI-REGION

## Status
ACCEPTED

Use Multi-AZ resilience.

Do not implement active-active multi-region V1.

---

# ADR-078 — INITIAL DR TARGET

## Status
ACCEPTED

Architecture target:

```text
RPO <= 15 minutes
RTO <= 4 hours
```

subject to future business revision.

---

# ADR-079 — QUARTERLY RESTORE TEST

## Status
ACCEPTED

Production backup restore must be exercised periodically.

---

# ADR-080 — COST MONITORING FROM DAY ONE

## Status
ACCEPTED

AWS budgets and service tagging required before production.

---

# ADR-081 — NO UNBOUNDED THIRD-PARTY SDK ADDITIONS

## Status
ACCEPTED

Any new client SDK requires review of:

- privacy;
- permissions;
- bundle impact;
- security;
- maintenance;
- business justification.

---

# ADR-082 — PRIVACY REVIEW FOR CLIENT SDKs

## Status
ACCEPTED

Every SDK must be included in:

- Apple privacy disclosure review;
- Google Data Safety review;
- internal data-flow inventory.

---

# ADR-083 — STATIC BUSINESS SECRETS NEVER SHIP IN MOBILE

## Status
ACCEPTED

Mobile binaries are considered public.

Any credential inside mobile must be treated as exposed.

---

# ADR-084 — CLIENT VALIDATION IS UX ONLY

## Status
ACCEPTED

Every material validation repeats server-side.

---

# ADR-085 — SERVER IS FINAL ENTITLEMENT AUTHORITY

## Status
ACCEPTED

Premium UI may optimistically render, but backend protects premium data/actions.

---

# ADR-086 — SERVER IS FINAL DATING ELIGIBILITY AUTHORITY

## Status
ACCEPTED

Client cannot infer or override mutual dating eligibility.

---

# ADR-087 — SERVER IS FINAL SAFETY AUTHORITY

## Status
ACCEPTED

Block, suspension, restrictions, bans are enforced server-side even if client state stale.

---

# ADR-088 — IN-APP NOTIFICATION IS CANONICAL

## Status
ACCEPTED

Push is transport.

Database notification is persistent record.

---

# ADR-089 — PUSH CONTENT PRIVACY-FIRST

## Status
ACCEPTED

Default message push does not include message body.

---

# ADR-090 — DESIGN TOKENS AS CODE CONTRACT

## Status
ACCEPTED

All visual implementation uses semantic design tokens.

No arbitrary raw visual constants in feature code.

---

# ADR-091 — NO FEATURE-SPECIFIC DESIGN SYSTEM FORKS

## Status
ACCEPTED

Features compose approved components.

Do not create:

- event-specific button system;
- dating-specific theme system;
- separate premium visual system.

---

# ADR-092 — DARK MODE THROUGH SEMANTIC TOKENS

## Status
ACCEPTED

Components must not contain ad-hoc dark-mode branches for raw colors.

---

# ADR-093 — ACCESSIBILITY IS RELEASE REQUIREMENT

## Status
ACCEPTED

Critical components/screens must support:

- accessible labels;
- text scaling;
- contrast;
- touch targets;
- focus semantics.

---

# ADR-094 — CORE FEATURE FLAGS REQUIRE KILL SWITCH

## Status
ACCEPTED

High-risk features must support immediate disable:

- dating;
- image messaging;
- attendee discovery;
- connection requests if abuse incident.

---

# ADR-095 — SAFE DEFAULTS

## Status
ACCEPTED

When configuration missing or ambiguous:

- private over public;
- blocked over connected;
- safety-restricted over unrestricted;
- premium denied over assumed;
- dating disabled over assumed.

---

# ADR-096 — NO BACKGROUND LOCATION V1

## Status
ACCEPTED

No continuous/background location permission.

User location is collected only for active discovery purpose.

---

# ADR-097 — NO ADDRESS BOOK INGESTION V1

## Status
ACCEPTED

Do not upload contacts to bootstrap growth.

Referrals use share links.

---

# ADR-098 — NO INVASIVE DEVICE FINGERPRINTING WITHOUT REVIEW

## Status
ACCEPTED

Anti-abuse device signals may exist, but invasive tracking requires dedicated privacy/security approval.

---

# ADR-099 — BUSINESS RULE CHANGES REQUIRE PRODUCT TRACEABILITY

## Status
ACCEPTED

Any change to:

- dating;
- discovery;
- connection limits;
- safety;
- privacy;
- premium;

must reference approved requirement or decision.

---

# ADR-100 — CLAUDE CODE IS CONSTRAINED ENGINEERING AGENT

## Status
ACCEPTED

Claude Code is authorized to implement within the approved architecture.

It is not authorized to redefine architecture silently.

---

## Claude Must

- follow ADRs;
- follow business rules;
- use approved libraries;
- write tests;
- explain architectural deviations.

---

## Claude Must Not

- introduce new cloud platforms;
- add microservices;
- change database;
- change API style;
- weaken security;
- bypass authorization;
- replace vendor abstractions;
- add packages casually;
- alter safety policies;
- invent product scope.

---

# ADR OPERATING PROCEDURE

# 101. ADR REFERENCE IN CODE CHANGES

High-impact pull requests should reference relevant ADR.

Example:

```text
Architecture:
ADR-008
ADR-012
ADR-029
```

---

# 102. ADR VIOLATION CI

Where possible encode architecture as automated rules.

Examples:

- controller importing ORM → fail;
- mobile importing server module → fail;
- cross-domain repository access → fail;
- public DTO containing `phone_e164` → fail.

---

# 103. ADR REVIEW CADENCE

Review ADR pack:

- before beta;
- after major scale milestone;
- before geographic expansion requiring infrastructure change;
- after major incident;
- annually at minimum.

Do not review simply to modernize fashionable technology.

---

# 104. ADR REVERSAL STANDARD

Technology should change only when:

```text
Current Decision
+
Measured Pain
+
Material Business Impact
+
Better Alternative
+
Migration Plan
```

all exist.

"New tool is popular" is insufficient.

---

# 105. EXAMPLE REVERSAL — MICROservices

Valid evidence could include:

- messaging traffic dominates backend scaling;
- release contention becomes severe;
- messaging needs independent availability;
- team ownership is separate.

Then create:

`ADR-XXX Extract Messaging Service`

not:

rewrite entire backend.

---

# 106. EXAMPLE REVERSAL — SEARCH

If discovery query latency remains poor after:

- proper indexing;
- projection optimization;
- query tuning;
- read replicas/materialization;

then evaluate specialized retrieval engine.

---

# 107. EXAMPLE REVERSAL — ANALYTICS

If PostHog cost/privacy/warehouse strategy becomes unsuitable, replace through AnalyticsProvider abstraction.

Product analytics events remain stable.

---

# 108. ARCHITECTURE RISK REGISTER

## Risk A — Monolith Coupling

Mitigation:
module boundaries + fitness tests.

## Risk B — PostgreSQL Discovery Load

Mitigation:
PostGIS/indexes/projections/caching.

## Risk C — SMS Abuse Costs

Mitigation:
risk/rate controls.

## Risk D — Vendor Dependency

Mitigation:
provider interfaces.

## Risk E — Redis Authorization Staleness

Mitigation:
DB/source-of-truth checks for safety-critical actions.

## Risk F — AI-Generated Architecture Drift

Mitigation:
ADR-aware Claude configuration and CI rules.

---

# 109. ARCHITECTURE QUALITY ATTRIBUTES

The approved stack optimizes primarily for:

```text
Security
Maintainability
Developer Velocity
Reliability
Privacy
Operational Simplicity
Cost Discipline
Scalability
```

in that approximate order for V1.

---

# 110. WHAT WE ARE DELIBERATELY NOT OPTIMIZING FOR

V1 does not optimize for:

- hundreds of independent engineering teams;
- global active-active deployment;
- billion-user throughput;
- ultra-low-latency financial trading behavior;
- arbitrary plugin ecosystem.

Designing for these would harm present execution.

---

# 111. ARCHITECTURE FREEZE STATEMENT

Following approval of this ADR pack, the following architecture should be treated as **frozen for V1 implementation**:

```text
React Native + Expo
TypeScript
Expo Router
TanStack Query
Zustand limited usage

NestJS Modular Monolith
REST + OpenAPI
PostgreSQL + PostGIS
Redis
SQS + Transactional Outbox
WebSockets

AWS
ECS Fargate
RDS
ElastiCache
S3
CloudFront
WAF
Secrets Manager
KMS

Twilio Verify
RevenueCat
PostHog
Sentry

Next.js Admin
Terraform
GitHub Actions
EAS
```

Technology substitutions now require an ADR rather than an ad-hoc coding decision.

---

# 112. WHAT THE ARCHITECTURE NOW ENABLES

We now have:

```text
Product Definition            ✓
Screen Behavior               ✓
Business Rules                ✓
Data Model                    ✓
Authorization                 ✓
Trust & Safety                ✓
Notifications                 ✓
Analytics                     ✓
Design System                 ✓
System Architecture           ✓
Architecture Decisions        ✓
```

This means we should **stop designing the product at the conceptual level** and prepare the engineering system that will actually build it.

---

# NEXT ARTIFACT

The next artifact is the most important document for your original Claude Code goal:

# **Claude Code Ultra-Professional Engineering Constitution**

This should define exactly how Claude is allowed to operate inside the Project Connect repository.

It should include:

```text
CLAUDE.md master instructions

Repository governance

Architecture rules

Coding standards

TypeScript standards

React Native standards

NestJS standards

Database rules

Security rules

Privacy rules

Trust & Safety rules

API standards

Testing requirements

Dependency policy

Git policy

Migration policy

Observability rules

Design-system usage

Documentation standards

Definition of Done

AI agent roles

Claude subagents

Claude skills

Claude permissions

Claude hooks

Plan Mode requirements

Code-review workflow

Security-review workflow

QA workflow

Forbidden actions

Architecture-change protocol

Feature implementation workflow

Bug-fix workflow

Production incident workflow
```

After that artifact, we should build the **exact repository bootstrap package**—actual folders, `CLAUDE.md`, `.claude/settings.json`, subagents, hooks, commands, lint/typecheck/test configuration, GitHub workflows, and the commands you will run on a clean machine.

That is the point where we move from **planning Project Connect** to **creating the professional Claude Code development environment from zero.**