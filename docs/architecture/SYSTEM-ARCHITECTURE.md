# V1 TECHNICAL / SYSTEM ARCHITECTURE SPECIFICATION

## Product
**Project Connect**

## Version
**V1.0 — Architecture Candidate for Freeze**

## Product Category
Verified Indian-diaspora social, community, event, and dating platform

## Initial Market
Dallas–Fort Worth, Texas

## Platforms
- iOS
- Android
- Admin Web Console

## Architecture Objective

Build a production-grade platform that is:

- fast enough to launch;
- safe enough for dating/social use;
- inexpensive enough for a startup;
- structured enough to avoid a rewrite after product-market fit;
- simple enough for a small engineering team plus Claude Code to maintain;
- capable of scaling city-by-city without premature microservice complexity.

---

# 1. EXECUTIVE ARCHITECTURE DECISION

The recommended V1 architecture is:

> **React Native + Expo mobile application, TypeScript modular-monolith backend, PostgreSQL/PostGIS system of record, Redis for ephemeral state/rate limiting, SQS for asynchronous work, WebSockets for realtime delivery, AWS managed infrastructure, and carefully selected managed vendors for OTP, subscriptions, analytics, crash reporting, and identity verification.**

We will **not** build V1 as microservices.

We will build:

> **A modular monolith with strict domain boundaries and event-driven seams.**

This gives V1 startup speed while preserving the ability to split high-scale domains later.

---

# 2. FINAL V1 TECHNOLOGY STACK

## Mobile

```text
React Native
Expo
TypeScript strict mode
Expo Router
TanStack Query
Zustand — limited client state only
Zod
React Hook Form
Expo SecureStore
Expo Notifications
```

Expo's current documentation recommends Expo Router for Expo projects; it provides file-based routing, typed routes, deep linking, and native navigation integration.

The project should start on the **latest production-stable Expo SDK supported at repository bootstrap**, rather than hard-coding an architecture document to a stale minor release.

---

## Mobile Build & Delivery

```text
EAS Build
EAS Submit
EAS Update
TestFlight
Google Play Internal Testing
```

EAS supports separate build/update channels and OTA delivery of compatible JavaScript and asset changes. Native-code changes still require a new binary release.

---

## Admin Web

```text
Next.js
React
TypeScript
TanStack Query
Zod
Project Connect design-system package
```

The admin application is a **separate application and security boundary** from the consumer mobile app.

---

## Backend

```text
Node.js LTS
NestJS
TypeScript strict mode
REST JSON API
OpenAPI 3.1
Zod runtime validation
WebSocket gateway
```

Architecture:

**Modular monolith**

not:

**microservice-per-domain**

for V1.

---

## Database

```text
Amazon RDS for PostgreSQL
PostGIS
```

AWS RDS for PostgreSQL supports PostGIS, making it appropriate for radius/distance queries without introducing a separate geospatial datastore.

---

## Data Access

Recommended:

```text
Drizzle ORM
+
reviewable SQL migrations
+
raw SQL where PostGIS/query optimization requires it
```

The ORM is a productivity tool.

It is **not** permitted to hide:

- query plans;
- transactions;
- locking;
- spatial queries;
- indexing.

---

## Cache / Ephemeral State

```text
Amazon ElastiCache for Redis
```

Use for:

- OTP abuse counters;
- rate limiting;
- session-related ephemeral state;
- presence;
- WebSocket fan-out;
- short-lived discovery cache;
- idempotency cache;
- distributed locks where truly needed.

Redis is **not** the system of record for:

- connections;
- messages;
- subscriptions;
- blocks;
- reports.

---

## Async Processing

```text
Amazon SQS
EventBridge Scheduler
Transactional Outbox
```

Use asynchronous workers for:

- push notifications;
- request expiry;
- event reminders;
- moderation processing;
- image moderation;
- analytics publishing;
- account deletion;
- media cleanup;
- subscription webhook processing/reconciliation.

---

## Media

```text
Amazon S3
CloudFront CDN
Presigned uploads
```

Logical separation:

```text
profile-media
event-media
message-media
support-media
verification-private
```

Verification evidence must **not** share the same public-read strategy as ordinary profile media.

---

## Phone Verification

```text
Twilio Verify v2
```

Twilio Verify supports SMS OTP and multiple verification channels and exposes the current v2 API for verification workflows.

Twilio verifies possession of the phone number.

Project Connect remains responsible for:

- user account;
- session issuance;
- abuse control;
- account lifecycle.

---

## Subscriptions

```text
RevenueCat
+
Apple App Store
+
Google Play
```

RevenueCat provides a current React Native SDK and handles cross-store entitlement management, while our backend still mirrors canonical Project Connect entitlements through authenticated webhook processing.

Apple also provides the App Store Server API for server-side transaction/subscription state when direct reconciliation is required.

Google Play similarly exposes real-time subscription notifications for subscription lifecycle changes.

---

## Product Analytics

Recommended V1:

```text
PostHog
```

Use for:

- product events;
- funnels;
- cohorts;
- experiments.

Important:

**Session replay disabled by default.**

This is a dating/social application with sensitive screens.

Raw chat content, dating preferences, precise location, reports, and PII must not enter product analytics.

---

## Error / Crash Monitoring

```text
Sentry
```

Use for:

- React Native crashes;
- frontend errors;
- backend exceptions;
- release tracking;
- performance traces.

Sanitize all PII and private-message content before transmission.

---

## Push Delivery

Recommended:

```text
Firebase Cloud Messaging
```

for device push routing across Android and iOS.

Application-level push abstraction must prevent vendor coupling.

---

## Identity Verification

Create:

```text
IdentityVerificationProvider
```

interface.

Do **not** tightly bind domain logic to a specific verification vendor.

Candidate vendors should be evaluated for:

- selfie/liveness quality;
- U.S. privacy posture;
- biometric retention;
- pricing;
- SDK quality;
- false-positive rates;
- international readiness.

Vendor procurement is deliberately separated from application architecture.

---

# 3. ARCHITECTURE DIAGRAM

```text
                         ┌──────────────────────────────┐
                         │        iOS / Android         │
                         │ React Native + Expo          │
                         │ Expo Router                  │
                         │ TanStack Query               │
                         └──────────────┬───────────────┘
                                        │ HTTPS
                                        │
                              ┌─────────▼─────────┐
                              │ AWS WAF / ALB     │
                              └─────────┬─────────┘
                                        │
                           ┌────────────▼────────────┐
                           │     API APPLICATION     │
                           │                         │
                           │ NestJS Modular Monolith │
                           │                         │
                           │ Identity                │
                           │ Profile                 │
                           │ Discovery               │
                           │ Connections             │
                           │ Messaging               │
                           │ Events                  │
                           │ Safety                  │
                           │ Billing                 │
                           │ Notifications           │
                           │ Admin                   │
                           └──────┬─────────┬────────┘
                                  │         │
                 ┌────────────────┘         └───────────────┐
                 │                                          │
         ┌───────▼────────┐                        ┌────────▼───────┐
         │ PostgreSQL     │                        │ Redis          │
         │ + PostGIS      │                        │                │
         │ Amazon RDS     │                        │ Rate limits    │
         │                │                        │ Presence       │
         │ SYSTEM OF      │                        │ Cache          │
         │ RECORD         │                        │ WS fan-out     │
         └───────┬────────┘                        └────────────────┘
                 │
                 │ Transactional Outbox
                 ▼
          ┌───────────────┐
          │     SQS       │
          └──────┬────────┘
                 │
           ┌─────▼─────┐
           │ Workers   │
           └─────┬─────┘
                 │
      ┌──────────┼───────────┬────────────┬──────────────┐
      ▼          ▼           ▼            ▼              ▼
     FCM       Twilio     RevenueCat     S3/CDN      Analytics
   Push        Verify                    Media
```

---

# 4. ADMIN ARCHITECTURE

```text
 Admin Browser
      │
      ▼
CloudFront / WAF
      │
      ▼
Admin Web App
      │
      ▼
/admin API Namespace
      │
      ▼
Dedicated Staff Authentication
      │
      ▼
RBAC + ABAC Authorization
```

Consumer authentication must **not automatically grant admin authentication**.

---

# 5. REPOSITORY STRATEGY

Use a monorepo.

Recommended:

```text
project-connect/
│
├── apps/
│   ├── mobile/
│   ├── admin/
│   ├── api/
│   └── worker/
│
├── packages/
│   ├── ui/
│   ├── design-tokens/
│   ├── api-client/
│   ├── api-contracts/
│   ├── domain-types/
│   ├── validation/
│   ├── config/
│   ├── analytics/
│   ├── observability/
│   └── testing/
│
├── infrastructure/
│   └── terraform/
│
├── docs/
│
├── scripts/
│
├── .claude/
│
├── CLAUDE.md
│
└── package.json
```

---

# 6. PACKAGE MANAGEMENT

Recommended:

```text
pnpm workspaces
+
Turborepo
```

Objectives:

- deterministic dependencies;
- fast local builds;
- shared packages;
- cached CI tasks;
- isolated application boundaries.

---

# 7. DOMAIN MODULES

Backend modules:

```text
Identity
Profile
Discovery
Connections
Messaging
Events
TrustSafety
Notifications
Billing
Media
Admin
Configuration
Audit
```

---

# 8. MODULAR MONOLITH RULE

Domains may live in the same deployable backend but must not become an unstructured codebase.

Example:

```text
modules/
  connections/
    domain/
    application/
    infrastructure/
    api/
```

---

# 9. DOMAIN OWNERSHIP

Example:

**Messaging** may ask Connections:

> Is this relationship active?

It may not directly update the Connections table.

Trust & Safety may request:

> Suspend user.

It should invoke account-domain behavior rather than directly mutating arbitrary tables.

---

# 10. WHY NOT MICROSERVICES NOW

Microservices would introduce premature complexity:

- service discovery;
- multiple deployments;
- distributed transactions;
- cross-service tracing;
- more queues;
- contract management;
- operational overhead.

Our scale problem is initially:

> acquiring users.

Not:

> decomposing 100 million requests/sec.

---

# 11. SCALE-OUT SEAMS

The following domains can later become independent services if justified:

```text
Messaging
Notifications
Discovery / Recommendations
Media Processing
Trust & Safety
Analytics
```

Our module boundaries and outbox/domain events preserve this path.

---

# 12. API STYLE DECISION

Use:

> **REST + JSON**

for transactional APIs.

Do not use GraphQL for V1.

Reasons:

- simpler authorization;
- simpler caching;
- simpler Claude-generated code review;
- easier observability;
- easier OpenAPI contract generation;
- fewer query-complexity risks.

---

# 13. API CONTRACT

Use OpenAPI 3.1 as formal contract.

Generate:

- mobile TypeScript client;
- admin TypeScript client;
- test mocks where appropriate.

---

# 14. API VERSIONING

Initial:

```text
/api/v1/
```

Examples:

```text
/api/v1/discovery
/api/v1/connections/requests
/api/v1/conversations
/api/v1/events
```

Avoid endpoint-specific version chaos.

---

# 15. API RESPONSE FORMAT

Success:

```text
{
  "data": {...},
  "meta": {...}
}
```

Error:

```text
{
  "error": {
    "code": "REQUEST_LIMIT_REACHED",
    "message": "You’ve reached today’s connection limit.",
    "correlationId": "..."
  }
}
```

---

# 16. DOMAIN ERROR CODES

Never leak:

- SQL errors;
- stack traces;
- AWS internals;
- provider errors.

Map infrastructure errors into stable domain errors.

---

# 17. PAGINATION

Use cursor pagination.

Never design high-volume lists around OFFSET.

Cursor examples:

```text
created_at + id
sent_at + id
ranking_cursor
```

---

# 18. IDEMPOTENCY

Mutation APIs requiring retry safety must accept:

```text
Idempotency-Key
```

Required for:

- connection accept;
- RSVP;
- message creation;
- payment-related callbacks;
- account-deletion request.

---

# 19. AUTHENTICATION ARCHITECTURE

Flow:

```text
Phone Number
    ↓
Twilio Verify OTP
    ↓
Verification Success
    ↓
Identity Service
    ↓
Project Connect User
    ↓
Access Token + Refresh Token
```

---

# 20. ACCESS TOKEN

Recommended:

JWT access token.

Short lifetime:

approximately **10–15 minutes**.

Contains minimal claims:

```text
sub
session_id
token_version
```

Do not put:

- profile details;
- dating preference;
- entitlements;
- admin permissions

into long-lived client claims that can become stale.

---

# 21. REFRESH TOKEN

Use:

- opaque random token;
- high entropy;
- stored only as a hash server-side;
- rotated on use;
- reusable-token detection;
- revocable session chain.

---

# 22. MOBILE TOKEN STORAGE

Refresh/access credentials stored with:

```text
Expo SecureStore
```

Never AsyncStorage.

---

# 23. SESSION MODEL

Each login creates session:

```text
session_id
user_id
refresh_token_hash
device_context
created_at
last_used_at
expires_at
revoked_at
```

Users can later support:

**Log out all devices**

without redesign.

---

# 24. AUTH ABUSE CONTROLS

Rate limit:

- OTP requests / phone;
- OTP requests / IP;
- OTP requests / device;
- failed OTP attempts;
- refresh abuse.

Twilio verification success does not automatically mean account is safe.

---

# 25. STAFF AUTHENTICATION

Admin authentication is separate.

Recommended:

```text
Dedicated staff IdP
+
mandatory MFA
```

Possible implementation:

AWS Cognito Staff User Pool with TOTP MFA.

Do not store admin passwords ourselves.

---

# 26. AUTHORIZATION ENGINE

Backend authorization flow:

```text
Authenticate
↓
Account Status
↓
Restriction Policy
↓
Block Policy
↓
Resource Ownership / Relationship
↓
Eligibility
↓
Entitlement
↓
Feature Flag
↓
Action Policy
```

---

# 27. CENTRAL POLICY SERVICES

Implement:

```text
ProfilePolicy
DiscoveryPolicy
ConnectionPolicy
MessagingPolicy
DatingPolicy
EventPolicy
SafetyPolicy
BillingPolicy
AdminPolicy
```

Controllers must not repeat complex authorization logic.

---

# 28. DATABASE ARCHITECTURE

Primary datastore:

```text
Amazon RDS PostgreSQL
Multi-AZ production deployment
encrypted storage
automated backups
point-in-time recovery
```

---

# 29. POSTGIS

Use PostGIS for:

- radius candidate queries;
- distance calculations;
- metro proximity.

Public responses receive:

**rounded approximate distance**

never coordinates.

---

# 30. LOCATION QUERY MODEL

Conceptual:

```text
User location point
↓
ST_DWithin()
↓
Eligible candidates
↓
Business-rule filters
↓
Ranking
```

---

# 31. NO CONTINUOUS LOCATION HISTORY

V1 stores:

> current discovery location

not:

> user's historical GPS trail.

New location replaces previous precise operational point.

This materially reduces privacy risk.

---

# 32. DISCOVERY ARCHITECTURE

Discovery happens in four stages:

```text
Candidate Generation
↓
Hard Eligibility Filtering
↓
Scoring
↓
Presentation
```

---

# 33. CANDIDATE GENERATION

Database identifies profiles based on:

- ACTIVE;
- discoverable;
- market;
- radius;
- current mode.

---

# 34. HARD FILTERING

Remove:

- blocks;
- suspended users;
- incompatible intent;
- invalid dating candidates;
- recent suppressions;
- profile-incomplete users.

---

# 35. SCORING

V1 deterministic score:

```text
Intent compatibility
Shared interests
Proximity
Language overlap
Verification
Profile quality
Recent activity
```

---

# 36. NO ML RECOMMENDER IN V1

Do not build machine-learning recommendation infrastructure before behavioral data exists.

The initial model must be:

- transparent;
- configurable;
- measurable.

---

# 37. RANKING VERSIONING

Store:

```text
ranking_version
```

on impressions/events.

Allows later A/B comparisons.

---

# 38. DISCOVERY PERFORMANCE

Do not query dozens of join tables per card.

Build optimized candidate query/projection.

Potential future:

materialized discovery features.

Not required initially.

---

# 39. PROFILE PROJECTION

Create centralized:

```text
ProfileProjectionService
```

It takes:

```text
viewer
target
context
```

and emits allowed fields.

This prevents PII leakage from inconsistent controllers.

---

# 40. MESSAGING ARCHITECTURE

Core principle:

> **Database mutation is authoritative; WebSocket is delivery transport.**

---

# 41. MESSAGE SEND FLOW

```text
Mobile
↓
POST /conversations/{id}/messages
↓
Authorization
↓
Validate
↓
Insert PostgreSQL message
↓
Write Outbox Event
↓
Commit
↓
Publish Realtime Event
↓
Recipient WebSocket
↓
Push fallback if offline
```

---

# 42. WHY MESSAGE SEND USES REST

Do not make WebSocket the only mutation path.

REST provides:

- idempotency;
- simple authorization;
- stable errors;
- tracing;
- retry semantics;
- easier audit.

WebSocket provides:

- low-latency delivery.

---

# 43. REALTIME TRANSPORT

Recommended:

```text
Socket.IO / WebSocket gateway
running with backend
```

Scale across instances using:

```text
Redis adapter/pub-sub
```

---

# 44. WEBSOCKET AUTH

On connect:

- provide short-lived access token;
- validate session/account;
- associate socket with user ID.

Do not trust arbitrary subscription rooms requested by client.

Server determines authorized rooms.

---

# 45. REALTIME EVENTS

Examples:

```text
message.created
conversation.updated
connection.accepted
notification.created
```

Avoid broadcasting internal domain payloads directly.

Use client DTOs.

---

# 46. PRESENCE

Presence is ephemeral.

Store in Redis:

```text
online
last_seen_ephemeral
active_conversation
```

Do not make presence authoritative PostgreSQL state.

---

# 47. OFFLINE MESSAGING

Messages always persist first.

Offline recipient receives:

- message in database;
- push notification if allowed.

Upon reconnection:

client queries missed messages using cursor.

---

# 48. BLOCK PROPAGATION

Block operation must:

```text
create block
invalidate pending request
deactivate connection
make conversation read-only
invalidate discovery caches
publish safety-state event
```

Message endpoints re-check block state regardless of old WebSocket connection.

---

# 49. MEDIA UPLOAD FLOW

```text
Mobile
↓
Request Upload Authorization
↓
API validates account/media intent
↓
Presigned S3 upload URL
↓
Mobile uploads directly to S3
↓
Media record PENDING
↓
Async moderation worker
↓
APPROVED / REJECTED
↓
CDN delivery if approved
```

---

# 50. WHY API DOES NOT PROXY LARGE MEDIA

Avoid sending image payload through application servers.

Benefits:

- reduced backend bandwidth;
- improved scalability;
- simpler retries.

---

# 51. MEDIA SECURITY

Rules:

- random storage keys;
- content-type validation;
- maximum size;
- image decode validation;
- malware scanning where relevant;
- metadata stripping;
- moderation before publication.

---

# 52. EXIF

Strip sensitive EXIF metadata from profile images.

Especially:

- GPS;
- device metadata.

---

# 53. IMAGE TRANSFORMATION

Generate standardized variants:

```text
thumbnail
card
profile-large
```

Prefer async media-processing worker/CDN transformation.

---

# 54. PRIVATE VERIFICATION MEDIA

Separate bucket/access policy.

No public CDN URL.

Only verification provider/service with authorized temporary access.

---

# 55. EVENT ARCHITECTURE

Events remain in PostgreSQL.

RSVP capacity transaction:

```text
BEGIN
lock event/capacity state
validate availability
insert/update RSVP
COMMIT
```

Prevent oversubscription race.

---

# 56. EVENT REMINDERS

Use EventBridge Scheduler or application scheduling worker to enqueue:

```text
24h reminder
2h reminder
```

Before delivery worker sends:

re-check:

- event active;
- RSVP active;
- user preference.

---

# 57. NOTIFICATION ARCHITECTURE

```text
Domain Event
↓
Transactional Outbox
↓
Notification Worker
↓
Notification Policy
↓
Template Renderer
↓
In-App Notification
↓
Push / Email / SMS where applicable
```

---

# 58. IN-APP NOTIFICATION IS CANONICAL

Push is best effort.

The database notification record is the user-facing persistent source.

---

# 59. PUSH ABSTRACTION

Interface:

```text
PushProvider.send()
```

Initial implementation:

Firebase Cloud Messaging.

Architecture permits future provider replacement.

---

# 60. PUSH PRIVACY

Payload contains:

- notification type;
- safe title/body;
- opaque internal entity ID/deep-link context.

Never:

- location coordinates;
- report details;
- message contents by default;
- phone/email.

---

# 61. ASYNC ARCHITECTURE

Use SQS queues by concern rather than one giant queue.

Candidate queues:

```text
notification-jobs
media-moderation
safety-processing
account-deletion
analytics-publish
billing-events
maintenance-jobs
```

---

# 62. DEAD-LETTER QUEUES

Every important queue requires DLQ.

Especially:

- deletion;
- billing;
- safety;
- notifications.

DLQ depth must be monitored.

---

# 63. TRANSACTIONAL OUTBOX

Critical domain changes write outbox row in same DB transaction.

Example:

```text
connection accepted
+
outbox CONNECTION_ACCEPTED
```

A publisher worker forwards event asynchronously.

This prevents dual-write inconsistency.

---

# 64. EVENT DELIVERY SEMANTICS

Assume:

> **at least once**

not exactly once.

Consumers must be idempotent.

---

# 65. SUBSCRIPTION ARCHITECTURE

```text
Mobile
↓
RevenueCat SDK
↓
Apple / Google
↓
RevenueCat
↓
Signed/verified webhook
↓
Billing Worker
↓
Subscription Record
↓
Project Connect Entitlements
```

---

# 66. ENTITLEMENT SOURCE OF TRUTH

Project Connect backend maintains effective entitlements.

Mobile RevenueCat state is useful for responsive UX.

Backend remains final authority for protected premium APIs.

---

# 67. WEBHOOK SECURITY

RevenueCat/provider webhooks require:

- authentication/signature verification;
- idempotent provider event ID;
- raw event archival where appropriate;
- replay protection.

---

# 68. BILLING RECONCILIATION

Background reconciliation periodically compares backend state to provider state.

This protects against:

- missed webhook;
- delayed webhook;
- transient processing failure.

---

# 69. FEATURE FLAGS

V1 requirement:

internal server-controlled feature flags.

Stored in platform config with:

- key;
- enabled;
- market;
- rollout;
- updated_by;
- audit.

---

# 70. WHY NOT CLIENT-ONLY FLAGS

Safety kill switches must take effect server-side.

Examples:

- dating disable;
- attendee discovery disable;
- image messaging disable.

---

# 71. REMOTE CONFIG

Separate:

**feature enablement**

from:

**business configuration**

Examples configuration:

```text
connection limits
request expiration
ranking weights
distance limits
```

Validate config types centrally.

---

# 72. TRUST & SAFETY ARCHITECTURE

```text
User Report
↓
Report Service
↓
Severity Classification
↓
Moderation Queue
↓
Admin Moderator
↓
Enforcement
↓
Account / Feature Restrictions
↓
Audit
```

---

# 73. AUTOMATED SAFETY SIGNALS

Automation may emit:

```text
risk_category
risk_score
model_version
```

It does not directly equal guilt.

Permanent enforcement remains governed by T&S policy.

---

# 74. REPORT EVIDENCE

Evidence is referenced by ID.

Do not copy entire chat histories into reports.

Preserve:

- relevant message IDs;
- media IDs;
- profile snapshot if needed.

---

# 75. ADMIN SECURITY

Admin app must be protected by:

- separate authentication;
- MFA;
- RBAC;
- ABAC;
- short session;
- WAF;
- audit.

---

# 76. ADMIN NETWORK ACCESS

At mature stage, consider:

- Zero Trust access;
- corporate device requirements.

For V1:
strong IdP + MFA + WAF + role restrictions.

---

# 77. ADMIN DATA PROJECTIONS

Separate DTOs:

```text
ModeratorUserDto
SupportUserDto
EventManagerUserDto
SuperAdminUserDto
```

Do not send one giant internal user object.

---

# 78. INFRASTRUCTURE PLATFORM

Recommended cloud:

**AWS**

Primary region:

Choose U.S. region based on latency/business requirements.

For DFW launch:

a central/eastern U.S. AWS region with strong service availability is acceptable.

Do not tightly encode the region into application logic.

---

# 79. AWS PRODUCTION TOPOLOGY

```text
AWS Account — Production

VPC
├── Public Subnets
│   └── Application Load Balancer
│
├── Private Application Subnets
│   ├── ECS Fargate API
│   └── ECS Fargate Workers
│
└── Private Data Subnets
    ├── RDS PostgreSQL
    └── ElastiCache Redis
```

---

# 80. CONTAINER PLATFORM

Use:

```text
Amazon ECS Fargate
```

rather than Kubernetes.

Why:

- no cluster-management burden;
- container deployment;
- autoscaling;
- mature networking;
- easier small-team operations.

---

# 81. WHY NOT KUBERNETES

Kubernetes is not required to prove this business.

It would add:

- cluster upgrades;
- ingress complexity;
- policies;
- autoscaler management;
- operational cognitive load.

Reconsider only if scale/team requirements justify it.

---

# 82. CONTAINERS

Separate deployable processes:

```text
api
worker
```

Potential future:

```text
realtime-gateway
```

only when traffic warrants separation.

---

# 83. API AUTOSCALING

Scale Fargate tasks based on:

- CPU;
- memory;
- request count;
- p95 latency.

Do not autoscale solely on CPU if WebSocket connections dominate.

---

# 84. WORKER AUTOSCALING

Scale based on:

- SQS queue depth;
- oldest message age.

---

# 85. DATABASE CONNECTIVITY

Use connection pooling.

Potential:

```text
RDS Proxy
```

if connection churn becomes relevant.

Initial architecture may use application pooling with conservative limits.

---

# 86. NETWORK SECURITY

RDS and Redis:

- no public endpoint;
- private subnets;
- security groups accepting only application tier.

---

# 87. TLS

All public traffic:

HTTPS TLS 1.2+.

AWS ACM manages public certificates.

Internal provider APIs also HTTPS.

---

# 88. WAF

AWS WAF should protect public API/admin surfaces.

Rules:

- common exploits;
- request-size constraints;
- IP reputation where appropriate;
- rate-based rules.

Application-level rate limits remain necessary.

---

# 89. API RATE LIMITING

Use Redis-backed rate limiters.

Dimensions:

```text
IP
user
device
phone
endpoint
```

Different policies for:

- OTP;
- login;
- discovery;
- connection requests;
- reports;
- uploads.

---

# 90. SECRETS

Store in:

```text
AWS Secrets Manager
```

Examples:

- Twilio API secret;
- RevenueCat webhook secret;
- analytics keys requiring secrecy;
- signing keys;
- DB password.

Never:

- repository;
- CLAUDE.md;
- `.env` committed;
- mobile binary if secret.

---

# 91. CLIENT KEYS

Some mobile keys are inherently public.

Treat them as:

> identifiers

not:

> secrets.

Restrict provider keys by:

- app ID;
- bundle ID;
- server-side authorization.

---

# 92. KMS

Use AWS KMS for encryption of:

- RDS;
- S3;
- secrets;
- sensitive queues where appropriate.

---

# 93. STRUCTURED LOGGING

Backend logs:

JSON.

Recommended fields:

```text
timestamp
level
service
environment
request_id
correlation_id
user_id_pseudonymous
route
duration_ms
error_code
```

Never log sensitive payload by default.

---

# 94. CORRELATION ID

Every inbound request receives:

```text
X-Correlation-ID
```

or server-generated equivalent.

Propagate through:

- API;
- outbox;
- workers;
- provider calls.

---

# 95. OPENTELEMETRY

Instrument with OpenTelemetry.

This avoids locking tracing semantics to one observability vendor.

Track:

```text
HTTP
DB
Redis
SQS
external provider
worker jobs
```

---

# 96. SENTRY

Sentry receives:

- mobile crashes;
- backend errors;
- sanitized traces.

Set:

- release;
- environment;
- commit SHA.

---

# 97. CLOUDWATCH

Use for:

- infrastructure metrics;
- logs;
- alarms;
- ECS health;
- RDS health;
- Redis health;
- SQS backlog.

---

# 98. ALERTING

Critical alerts:

- API error spike;
- API unavailable;
- RDS storage/CPU/connectivity;
- Redis unavailable;
- queue backlog;
- billing DLQ;
- deletion DLQ;
- S4 moderation pipeline failure;
- push failure spike.

---

# 99. SLO TARGETS

Initial V1 targets:

## API Availability
**99.9% monthly**

## Routine API Latency
P95:
**<750ms**

## Message Create API
P95:
**<1 second**

## Message Delivery
normal conditions:
**<3 seconds**

## Crash-Free Sessions
target:
**>99.5%**

These are engineering objectives, not consumer contractual SLAs.

---

# 100. ENVIRONMENTS

Minimum:

```text
local
development
staging
production
```

Optional:

```text
preview per pull request
```

for admin web/mobile backend mocks.

---

# 101. AWS ACCOUNT STRATEGY

Recommended:

```text
AWS Organizations

Security / Management
Nonproduction
Production
```

Production should not share unrestricted credentials with development.

---

# 102. DATA ISOLATION

Never copy production PII into development/staging.

Use synthetic datasets.

---

# 103. MOBILE ENVIRONMENTS

Separate:

- application identifiers where necessary;
- API URLs;
- RevenueCat projects/apps;
- push configuration;
- Sentry environments.

---

# 104. CONFIGURATION VALIDATION

App must fail fast at startup/deployment if required configuration missing.

Use typed configuration schema.

---

# 105. INFRASTRUCTURE AS CODE

Use:

```text
Terraform
```

All production infrastructure must be IaC-managed.

Avoid console-created mystery resources.

---

# 106. TERRAFORM STRUCTURE

```text
infrastructure/
  modules/
    networking/
    ecs/
    rds/
    redis/
    s3/
    cloudfront/
    sqs/
    monitoring/
  environments/
    development/
    staging/
    production/
```

---

# 107. CI PROVIDER

Use:

```text
GitHub Actions
```

---

# 108. CI CHECKS — EVERY PR

Required:

```text
format
lint
TypeScript
unit tests
integration tests
API contract checks
migration validation
secret scan
dependency vulnerability scan
```

---

# 109. SECURITY SCANNING

Recommended:

- GitHub secret scanning;
- Dependabot or equivalent;
- CodeQL;
- container-image scanning;
- Terraform scanning.

---

# 110. CI DATABASE

Integration tests run against:

real ephemeral PostgreSQL

not an in-memory fake.

PostGIS should be enabled where discovery tests require it.

---

# 111. MOBILE CI

PR:

- TypeScript;
- lint;
- unit/component tests;
- Expo Doctor;
- route validation.

Main/release:

- EAS preview build;
- smoke tests.

---

# 112. PRODUCTION DEPLOYMENT

Flow:

```text
Merge release
↓
CI
↓
Build immutable Docker image
↓
Push ECR
↓
Database migration safety check
↓
Deploy ECS
↓
Health verification
↓
Smoke tests
↓
Monitor
```

---

# 113. DATABASE MIGRATIONS

Never automatically run uncontrolled migrations from API application startup.

Use dedicated migration job.

---

# 114. EXPAND-CONTRACT MIGRATIONS

For breaking schema changes:

```text
Add
↓
Deploy compatible code
↓
Backfill
↓
Switch reads/writes
↓
Remove old schema later
```

---

# 115. ROLLBACK

Application rollback:

redeploy prior image.

Schema rollback:

prefer forward corrective migrations.

Do not assume every DB migration is safely reversible.

---

# 116. EAS UPDATE POLICY

Use OTA only for:

- JavaScript;
- assets;
- non-native fixes compatible with installed runtime.

Production OTA rollout should support:

- staged channel;
- monitoring;
- rollback.

Expo documents channel-based EAS updates specifically for this model.

---

# 117. RELEASE CHANNELS

Recommended:

```text
development
preview
production
```

Do not publish directly from developer laptop to production.

CI owns production publishing.

---

# 118. GIT BRANCHING

Recommended:

trunk-based development.

```text
main
+
short-lived feature branches
```

Avoid long-lived:

```text
develop
qa
release
```

branches drifting for weeks.

---

# 119. PULL REQUEST POLICY

PR requires:

- passing CI;
- code review;
- no unresolved high-severity security issue;
- migration review if DB change;
- product reference for business-rule change.

---

# 120. PROTECTED AREAS

Require specialist review for changes to:

```text
auth
authorization
dating eligibility
blocking
reports
payments
account deletion
migrations
admin permissions
```

Claude cannot independently merge these changes.

---

# 121. TEST STRATEGY

Testing pyramid:

```text
Unit
  ↓
Domain Tests
  ↓
Integration
  ↓
API Contract
  ↓
Mobile Component
  ↓
E2E
```

---

# 122. UNIT TESTS

Focus on:

- ranking functions;
- age calculations;
- eligibility;
- entitlement;
- notification policy;
- state transitions.

---

# 123. DOMAIN TESTS

High priority:

```text
canDiscover
canSendRequest
canMessage
canRSVP
canUseDating
canUsePremiumFeature
```

These tests become architecture guardrails.

---

# 124. INTEGRATION TESTS

Use actual:

- PostgreSQL;
- Redis where appropriate.

Mock external providers.

---

# 125. CONTRACT TESTS

Ensure generated mobile/admin clients remain compatible with OpenAPI.

Breaking API change must fail CI.

---

# 126. MOBILE E2E

Recommended:

```text
Maestro
```

Primary journeys:

- signup;
- onboarding;
- discovery;
- connect;
- accept;
- message;
- report;
- block;
- event RSVP;
- subscription.

---

# 127. BACKEND E2E

Run full request-level tests against deployed staging environment for critical routes.

---

# 128. PROVIDER SANDBOXES

Use test environments for:

- Twilio;
- RevenueCat;
- Apple sandbox;
- Google test purchases;
- verification vendor.

Never use production providers during ordinary unit tests.

---

# 129. DATA BACKUP

RDS production:

- automated backups;
- PITR;
- Multi-AZ;
- encrypted snapshots.

---

# 130. BACKUP RESTORE TESTING

At least quarterly during early production:

perform restore exercise.

A backup is not trusted until recovery has been demonstrated.

---

# 131. DISASTER RECOVERY TARGETS

Initial architecture targets:

## RPO
<= 15 minutes

## RTO
<= 4 hours

for major database/platform incident.

These should be revised as revenue/user dependency increases.

---

# 132. OBJECT STORAGE

Enable:

- versioning where appropriate;
- lifecycle rules;
- encryption;
- deletion workflow integration.

---

# 133. MULTI-REGION

Do **not** deploy active-active multi-region for V1.

Cost/complexity is unjustified.

Instead:

- Multi-AZ within primary region;
- backup strategy;
- documented recovery.

---

# 134. CAPACITY PHILOSOPHY

Scale vertically/horizontally only when metrics demonstrate need.

Do not prebuild architecture for 50 million users.

---

# 135. EXPECTED V1 SCALE TARGET

Architecture should comfortably support approximately:

```text
tens of thousands of registered users
thousands of concurrent active users
high message/event bursts
```

without structural redesign.

Exact throughput must be validated with load tests.

---

# 136. LOAD TESTING

Before public launch test:

```text
login burst
discovery queries
connection requests
message sends
WebSocket concurrency
event RSVP surge
```

---

# 137. PERFORMANCE TEST DATA

Use realistic:

- profile joins;
- block lists;
- interest counts;
- geographic density.

A database with 100 test users does not prove discovery performance.

---

# 138. DISCOVERY QUERY BUDGET

Set internal query performance objective.

Example:

candidate generation:
P95 under ~300ms at target scale.

Final end-to-end discovery API still follows overall P95 objective.

---

# 139. DATABASE QUERY MONITORING

Enable:

```text
pg_stat_statements
```

Track:

- slow queries;
- high-call queries;
- query-plan regressions.

---

# 140. DATABASE INDEX GOVERNANCE

Every significant new index should identify:

- query benefited;
- write/storage cost.

No index accumulation without measurement.

---

# 141. CACHING PHILOSOPHY

Cache only when:

- source of truth remains clear;
- invalidation is understood;
- performance warrants it.

Do not cache safety-critical authorization for long durations.

---

# 142. CACHABLE CONTENT

Good candidates:

- taxonomy;
- feature config;
- city list;
- event category list.

Short TTL:

- entitlements;
- profile projections;
- discovery candidate results.

Immediate invalidation:

- blocks;
- suspension;
- bans.

---

# 143. SECURITY THREAT MODEL — PRIMARY RISKS

Architecture must explicitly defend against:

```text
Account takeover
OTP abuse
IDOR
Mass assignment
Token theft
Spam automation
Scraping
Location inference
Harassment bypass
Block bypass
Subscription spoofing
Admin privilege escalation
Media abuse
Webhook forgery
SQL injection
XSS in admin
Dependency compromise
```

---

# 144. OWASP PRACTICES

Security review must include current OWASP guidance for:

- API security;
- mobile security;
- web/admin security.

Security design is independent from UI hiding.

---

# 145. SCRAPING DEFENSE

Controls:

- authentication;
- rate limits;
- pagination limits;
- behavioral abuse detection;
- no global user search;
- signed media URLs/CDN controls where appropriate.

Do not embed all profile data in discovery responses.

---

# 146. PROFILE RESPONSE MINIMIZATION

Discovery card response contains only card fields.

Full profile only fetched after user opens profile.

This reduces:

- data transfer;
- scraping value;
- PII exposure.

---

# 147. SENSITIVE ENDPOINT NO-CACHE

Authentication, admin, billing, moderation endpoints should prevent intermediary/public caching.

---

# 148. CSRF

Mobile bearer-token API is not traditional cookie-CSRF sensitive.

Admin web authentication strategy must include proper CSRF defenses if cookie sessions are used.

---

# 149. CORS

API CORS must allow only approved web origins where browser access exists.

Do not use `*` for authenticated admin APIs.

---

# 150. CONTENT SECURITY POLICY

Admin web should deploy strict CSP.

Minimize third-party scripts.

---

# 151. FILE VALIDATION

Do not trust filename extension.

Validate:

- MIME;
- magic bytes;
- image decoding;
- size.

---

# 152. DATABASE PRIVILEGES

Separate roles:

```text
app_runtime
migration
readonly_ops
```

Runtime user should not own database.

---

# 153. SECURITY EVENT AUDIT

Audit:

- admin role change;
- user suspension/ban;
- PII reveal;
- feature flag change;
- manual entitlement override;
- organizer approval;
- critical evidence access.

---

# 154. COST ARCHITECTURE

Primary cost drivers will likely be:

```text
database
application compute
Redis
SMS OTP
media/CDN
verification provider
push
analytics
subscriptions vendor
moderation operations
```

---

# 155. COST CONTROL RULES

Implement AWS budgets from day one.

Alert thresholds:

- expected monthly spend;
- +25%;
- +50%.

Tag resources:

```text
Environment
Service
Owner
CostCenter
```

---

# 156. OTP COST CONTROL

Protect Twilio from abuse using:

- phone rate limits;
- IP limits;
- device limits;
- geo controls if needed;
- bot/risk challenge.

SMS fraud can become a material cost exposure.

---

# 157. MEDIA COST CONTROL

Enforce:

- file-size maximum;
- image compression;
- derived variants;
- CDN caching;
- lifecycle deletion.

---

# 158. ANALYTICS COST CONTROL

Do not emit meaningless high-frequency events.

Example:

Do not track every:

```text
scroll pixel
typing character
animation
```

Events must answer business questions.

---

# 159. THIRD-PARTY VENDOR PRINCIPLE

Vendor use is appropriate when it meaningfully reduces commodity engineering or regulatory complexity.

Use vendors for:

```text
SMS verification
app-store subscription abstraction
error monitoring
analytics
identity/liveness verification
```

Keep core differentiation internally controlled:

```text
profiles
discovery
intent
connections
safety policy
events
data graph
```

---

# 160. VENDOR ABSTRACTION

All external providers behind interfaces.

Examples:

```text
PhoneVerificationProvider
PushProvider
SubscriptionProvider
IdentityVerificationProvider
AnalyticsProvider
MediaModerationProvider
```

---

# 161. CIRCUIT BREAKERS

Provider failures should not cascade.

Example:

Sentry down:
app still works.

Analytics down:
connection still works.

Push down:
message still persists.

RevenueCat webhook delayed:
reconciliation recovers.

---

# 162. TIMEOUTS

Every external request needs explicit timeout.

No infinite provider calls.

---

# 163. RETRIES

Retry only operations safe to retry.

Use exponential backoff + jitter.

Do not blindly retry:

- invalid OTP;
- validation errors;
- permanent provider errors.

---

# 164. ADMIN WEB DEPLOYMENT

Recommended:

static/edge-served frontend where practical.

Admin backend remains `/admin` API in primary application.

Benefits:

- one authorization backend;
- no duplicate business logic.

---

# 165. MOBILE DATA STRATEGY

Use TanStack Query for server state:

```text
profiles
discovery
requests
connections
messages
events
notifications
subscription
```

---

# 166. ZUSTAND USAGE

Zustand only for small client-only state:

```text
onboarding draft
UI preferences
temporary filters
modal coordination
```

Do not copy server database into global Zustand.

---

# 167. SERVER STATE INVALIDATION

Example:

connection accepted:

invalidate/update:

```text
incoming requests
connections
conversation list
profile CTA state
```

Use targeted cache updates.

---

# 168. OFFLINE CACHE

Persist limited safe query data if required.

Do not persist sensitive moderation/dating data indiscriminately.

---

# 169. MOBILE API CLIENT

Generated from OpenAPI.

Centralized:

```text
auth token
correlation ID
retry policy
error mapping
```

No feature should manually call arbitrary URLs.

---

# 170. FORM VALIDATION

Use shared Zod schemas where appropriate.

Still validate independently on backend.

Client validation = UX.

Server validation = security/integrity.

---

# 171. DESIGN SYSTEM IMPLEMENTATION

Shared mobile:

```text
packages/ui
packages/design-tokens
```

Admin may share semantic tokens but not blindly reuse every native component.

---

# 172. ACCESSIBILITY

Automated and manual accessibility testing.

React Native components must provide:

- roles;
- labels;
- state;
- dynamic type.

---

# 173. DEEP LINKING

Expo Router handles route structure/deep links.

Every inbound link:

```text
parse route
↓
authenticate if needed
↓
load resource
↓
reauthorize
↓
render
```

Never trust notification/deep-link possession.

---

# 174. UNIVERSAL LINKS

Configure:

- iOS universal links;
- Android app links.

Needed for:

- referral;
- event sharing;
- notifications.

---

# 175. PUBLIC WEB LANDING PAGE

Not part of mobile backend UI architecture but recommended commercially.

Separate marketing site:

```text
www.projectconnect.com
```

App:

```text
app.projectconnect.com
```

API:

```text
api.projectconnect.com
```

Admin:

```text
admin.projectconnect.com
```

Final domains depend brand.

---

# 176. API SECURITY BOUNDARY

Consumer:

```text
/api/v1/*
```

Admin:

```text
/admin/v1/*
```

Internal worker/service:

not exposed publicly unless strictly necessary.

---

# 177. HEALTH ENDPOINTS

Provide:

```text
/health/live
/health/ready
```

Readiness checks only critical dependencies required for serving.

Do not expose sensitive details publicly.

---

# 178. MAINTENANCE MODE

Server-controlled.

Mobile bootstrap gets:

```text
maintenanceMode
minimumSupportedVersion
featureFlags
```

Allows controlled incident response.

---

# 179. MINIMUM APP VERSION

Server can enforce:

```text
soft update
hard update
```

Critical security issue may trigger hard update.

---

# 180. PRIVACY DELETION ARCHITECTURE

Deletion orchestration is asynchronous.

```text
Deletion Requested
↓
Account Hidden Immediately
↓
Session Revoked
↓
Deletion Job
↓
Domain Cleanup
↓
Media Deletion
↓
Permitted Pseudonymization
↓
Completion
```

---

# 181. DELETION RESILIENCE

Each domain deletion step must be idempotent.

Worker can resume after partial failure.

Track state:

```text
PENDING
PROCESSING
PARTIAL_FAILURE
COMPLETE
```

---

# 182. DATA RETENTION CONFIGURATION

Retention windows must exist in configuration/policy, not scattered constants.

Domains:

- OTP;
- notifications;
- verification artifacts;
- reports;
- audit;
- messages.

---

# 183. PRIVACY EXPORT — FUTURE READY

Data model should permit eventual account-data export without architecture rewrite.

Not necessarily required in first beta UI.

---

# 184. APP STORE PRIVACY

Mobile release process must track SDK/vendor data collection so:

- Apple privacy manifest/disclosures;
- Google Data Safety declarations

remain correct.

No SDK added casually without privacy review.

---

# 185. DEPENDENCY GOVERNANCE

New production dependency requires:

- maintenance activity;
- license;
- security;
- bundle/runtime impact;
- reason existing platform does not solve need.

Claude must not add packages casually.

---

# 186. NODE PACKAGE LOCK

Commit:

```text
pnpm-lock.yaml
```

CI uses frozen lockfile.

---

# 187. RUNTIME PINNING

Pin:

- Node major;
- pnpm version;
- Expo SDK;
- major infrastructure provider versions.

Use automated dependency PRs.

---

# 188. MOBILE SDK UPGRADE CADENCE

Do not remain several Expo/RN releases behind.

Evaluate upgrade regularly.

Upgrade first in:

development → staging → production.

---

# 189. SECURITY PATCH POLICY

Critical dependency/security patches receive accelerated release path.

---

# 190. ARCHITECTURE DECISION RECORDS

Every major technology decision receives ADR.

Initial required ADRs:

```text
ADR-001 React Native + Expo
ADR-002 Modular Monolith
ADR-003 REST + OpenAPI
ADR-004 PostgreSQL + PostGIS
ADR-005 AWS
ADR-006 ECS Fargate
ADR-007 Redis
ADR-008 REST Mutation + WebSocket Delivery
ADR-009 Twilio Verify
ADR-010 RevenueCat
ADR-011 S3 + CloudFront
ADR-012 SQS + Transactional Outbox
ADR-013 TanStack Query
ADR-014 Zustand Boundaries
ADR-015 Terraform
ADR-016 GitHub Actions
ADR-017 Analytics Provider
ADR-018 Error/Observability Stack
```

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](SPEC-RECONCILIATION.md) R-14, R-05:** this list (and the §217 list) was a preliminary proposed index. Where numbers or titles differ, the accepted `adr/ADR-PACK.md` wins (for example, ADR-015 is Monorepo and ADR-016 is Terraform in the pack). Drizzle ORM, FCM, EventBridge Scheduler, Vitest, Maestro, OpenTelemetry, CloudWatch and Sentry are ratified V1 supporting technologies.

---

# 191. ARCHITECTURE FITNESS FUNCTIONS

CI should mechanically protect architecture.

Examples:

- mobile cannot import backend modules;
- domain modules cannot import other module repositories directly;
- feature code cannot import raw design primitives;
- API controllers cannot access ORM directly;
- public DTOs cannot include prohibited PII fields.

---

# 192. DEPENDENCY DIRECTION

Backend:

```text
API
↓
Application
↓
Domain
↑
Infrastructure implements ports
```

Domain must not depend on NestJS/AWS/ORM.

This keeps business rules testable.

---

# 193. MODULE COMMUNICATION

Inside monolith:

application-service interfaces/domain events.

Not:

cross-module SQL queries scattered everywhere.

For performance-heavy read models, explicitly approved projection queries are acceptable.

---

# 194. CQRS POSITION

Do not implement heavyweight CQRS framework.

We may use:

- command-style application services;
- read projections.

But no event-sourcing/CQRS complexity without clear need.

---

# 195. EVENT SOURCING

Not V1.

PostgreSQL current state remains authoritative.

Outbox/domain events support integrations, not event sourcing.

---

# 196. NO-SQL DATABASE

Not required V1.

PostgreSQL handles current relational product well.

Introduce additional datastore only for demonstrated bottleneck.

---

# 197. SEARCH ENGINE

No Elasticsearch/OpenSearch V1.

No global people search.

PostgreSQL is sufficient.

---

# 198. AI ARCHITECTURE

No AI is required for core V1.

Potential future uses:

- moderation assistance;
- recommendation explanation;
- support.

Do not insert LLM calls into core discovery or safety enforcement prematurely.

---

# 199. CLAUDE IS DEVELOPMENT TOOL, NOT PRODUCTION DEPENDENCY

Claude Code helps us build the system.

Our application architecture must not depend on Claude being available at runtime.

---

# 200. INITIAL ENGINEERING TEAM OPERATING MODEL

Architecture should support small team ownership:

```text
Mobile
Backend
Product/Design
T&S/Operations
```

One backend codebase lowers coordination cost.

---

# 201. CODEOWNERS

Recommended:

```text
/auth            security/backend owner
/safety          T&S + backend owner
/billing         backend/finance owner
/infrastructure  platform owner
/mobile          mobile owner
/design-system   design/mobile owner
```

---

# 202. P0 TECHNICAL VERTICAL SLICE

First end-to-end implementation:

```text
Phone OTP
↓
Account
↓
Profile
↓
Location
↓
Intent
↓
Discovery
↓
Profile Projection
↓
Connection Request
↓
Acceptance
↓
Conversation
↓
Message
↓
Push
↓
Meaningful Connection Analytics
```

This validates almost every foundational architecture choice.

---

# 203. SECOND VERTICAL SLICE

Safety:

```text
Profile
↓
Block
↓
Authorization Enforcement
↓
Report
↓
Moderation Console
↓
Suspend
↓
Client Restriction
↓
Audit
```

---

# 204. THIRD VERTICAL SLICE

Events:

```text
Admin Event
↓
Events Discovery
↓
RSVP
↓
Reminder
↓
Attendee Visibility
↓
Post-Event Connection
```

---

# 205. FOURTH VERTICAL SLICE

Monetization:

```text
Paywall
↓
RevenueCat Purchase
↓
Webhook
↓
Entitlement
↓
Premium Filter
↓
Expiration/Reconciliation
```

---

# 206. PRODUCTION READINESS CHECKLIST

Before public launch:

## Mobile
- crash monitoring;
- privacy permissions;
- secure storage;
- deep links;
- push;
- store compliance.

## API
- autoscaling;
- rate limiting;
- WAF;
- tracing;
- load test.

## Data
- backups;
- PITR;
- restore test;
- encrypted storage.

## Safety
- moderation console;
- block/report;
- S4 alerting.

## Billing
- sandbox tested;
- webhook verification;
- reconciliation.

## Operations
- dashboards;
- alerts;
- incident process.

---

# 207. TECHNOLOGY WE ARE EXPLICITLY NOT USING IN V1

Unless an ADR changes the decision:

```text
Kubernetes
GraphQL
Microservices
Kafka
Elasticsearch
MongoDB
Firebase as the primary database
Event sourcing
Complex CQRS framework
Custom payment processor
Custom SMS infrastructure
Custom biometric verification
Custom analytics warehouse
ML recommendation engine
```

This exclusion list prevents AI-driven technology sprawl.

---

# 208. ARCHITECTURE PRINCIPLE — BUILD VS BUY

### Build

Core differentiation:

- profiles;
- intent;
- matching;
- discovery;
- connections;
- relationship graph;
- privacy;
- safety rules;
- events;
- premium policy.

### Buy

Commodity complexity:

- SMS delivery;
- app-store billing abstraction;
- crash reporting;
- cloud infrastructure;
- identity/liveness provider.

---

# 209. ARCHITECTURE PRINCIPLE — SAFETY BEFORE SPEED

No performance optimization may introduce stale behavior that allows:

- blocked messaging;
- banned-user discovery;
- expired entitlements;
- revoked admin roles.

Security/safety invalidation has priority over cache hit rate.

---

# 210. ARCHITECTURE PRINCIPLE — DATABASE FIRST, REALTIME SECOND

Realtime delivery does not replace durable state.

Correct sequence:

```text
Validate
Persist
Commit
Publish
Deliver
```

Never:

```text
Deliver
then hope persistence succeeds.
```

---

# 211. ARCHITECTURE PRINCIPLE — ASYNC SIDE EFFECTS

Primary user transaction should not synchronously wait for:

- analytics;
- email;
- push;
- recommendation refresh.

Commit business state first.

Process side effects asynchronously.

---

# 212. ARCHITECTURE PRINCIPLE — FAIL CLOSED FOR AUTHORIZATION

If authorization service cannot establish access:

deny.

Do not "temporarily allow."

---

# 213. ARCHITECTURE PRINCIPLE — FAIL OPEN SELECTIVELY FOR NONCRITICAL SYSTEMS

If analytics unavailable:

continue.

If Sentry unavailable:

continue.

If push unavailable:

continue after durable notification creation.

If subscription authorization unavailable and cached entitlement has safe grace semantics:

follow defined policy.

---

# 214. SYSTEM BOUNDARY MAP

```text
                    PROJECT CONNECT TRUST BOUNDARY

 Mobile ─────────── Public Internet ───────────────┐
                                                   │
 Admin ─────────── Public Internet ────────────────┤
                                                   ▼
                                               WAF / ALB
                                                   │
                                   ┌───────────────┴──────────────┐
                                   │                              │
                              Consumer API                    Admin API
                                   │                              │
                                   └───────────────┬──────────────┘
                                                   ▼
                                             Domain Layer
                                                   │
                        ┌──────────────────────────┼────────────────────┐
                        ▼                          ▼                    ▼
                   PostgreSQL                    Redis                 SQS
                        │
                        ▼
                   Object Storage

          External Trust Boundaries
          ─────────────────────────
          Twilio
          RevenueCat
          FCM
          Analytics
          Sentry
          Verification Provider
```

Every external boundary requires:

- timeout;
- error handling;
- privacy review;
- authentication;
- observability.

---

# 215. ARCHITECTURE REVIEW GATES

Before implementation begins, approve:

### Gate A — Product
Already substantially complete.

### Gate B — Data
Complete.

### Gate C — Authorization
Complete.

### Gate D — Safety
Complete.

### Gate E — Architecture
This document.

### Gate F — ADRs
Next.

### Gate G — Claude Engineering Environment

Only after ADRs are signed off.

---

# 216. ARCHITECTURE DECISIONS NOW FROZEN

Subject to formal ADR ratification:

1. Mobile = React Native + Expo.
2. Navigation = Expo Router.
3. Language = TypeScript.
4. Backend = NestJS modular monolith.
5. API = REST + OpenAPI.
6. Primary DB = PostgreSQL.
7. Location queries = PostGIS.
8. Cache/ephemeral state = Redis.
9. Async = SQS + transactional outbox.
10. Realtime = WebSocket/Socket.IO with Redis fan-out.
11. Message persistence happens before realtime delivery.
12. Cloud = AWS.
13. Compute = ECS Fargate.
14. Object media = S3 + CloudFront.
15. Consumer phone verification = Twilio Verify.
16. Mobile subscriptions = RevenueCat abstraction over Apple/Google.
17. Product analytics = PostHog with strict privacy controls.
18. Error monitoring = Sentry.
19. Infrastructure = Terraform.
20. CI/CD = GitHub Actions + EAS for mobile.
21. Admin = separate Next.js application and auth boundary.
22. No microservices for V1.
23. No Kubernetes for V1.
24. No GraphQL for V1.
25. No ML recommender for V1.
26. No exact location reaches the client.
27. Server is authority for safety, privacy, subscription and authorization.
28. External providers are wrapped behind interfaces.
29. All business-critical async processing is idempotent.
30. Claude Code must work inside these architecture boundaries rather than invent new infrastructure.

---

# 217. NEXT ARTIFACT

The next artifact should be:

## **V1 Architecture Decision Records — ADR Pack**

Rather than writing one generic architecture note, we should formally ratify each major decision:

```text
ADR-001 React Native + Expo
ADR-002 Modular Monolith
ADR-003 REST + OpenAPI
ADR-004 PostgreSQL + PostGIS
ADR-005 AWS Platform
ADR-006 ECS Fargate
ADR-007 Redis
ADR-008 Messaging Architecture
ADR-009 Authentication + Twilio Verify
ADR-010 RevenueCat
ADR-011 S3 + CloudFront
ADR-012 SQS + Transactional Outbox
ADR-013 Mobile State Management
ADR-014 Monorepo
ADR-015 Terraform
ADR-016 CI/CD
ADR-017 Analytics
ADR-018 Observability
ADR-019 Security Architecture
ADR-020 Data Privacy Architecture
```

Each ADR should contain:

- context;
- problem;
- decision;
- alternatives considered;
- why rejected;
- consequences;
- risks;
- mitigation;
- reversal conditions;
- implementation rules;
- Claude Code constraints.

Once that ADR pack is approved, **the architecture is officially frozen enough to build the Claude Code Ultra-Professional Engineering Constitution and repository from scratch.**