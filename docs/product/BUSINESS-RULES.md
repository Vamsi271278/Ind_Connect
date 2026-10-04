# V1 BUSINESS RULES CATALOG + FUNCTIONAL REQUIREMENTS MATRIX

## Product
**Project Connect**

## Version
**V1.0**

## Product Type
Verified Indian-diaspora connection platform

## Initial Market
Dallas–Fort Worth, Texas

## Platforms
- iOS
- Android
- Admin Web Console

## Status
Approved downstream artifact following:
- V1 Product Requirements Document
- V1 Screen-by-Screen UX + Functional Specification

---

# PART I — PURPOSE

This document defines the formal business behavior of Project Connect.

Its purpose is to prevent product logic from being scattered across:

- mobile UI;
- backend services;
- database triggers;
- feature flags;
- payment logic;
- moderation tools;
- analytics;
- developer assumptions.

Every material behavior must exist as an explicit rule.

This document is the authoritative source for:

- business rules;
- functional requirements;
- authorization logic;
- discovery eligibility;
- connection eligibility;
- dating eligibility;
- privacy precedence;
- safety precedence;
- subscription entitlement;
- event behavior;
- moderation;
- account lifecycle;
- notification conditions;
- analytics requirements.

---

# 1. RULE GOVERNANCE MODEL

Every formal rule has a unique identifier.

Format:

`BR-[DOMAIN]-###`

Examples:

- BR-AUTH-001
- BR-DISC-014
- BR-DATE-005
- BR-SAFE-021

Functional requirements use:

`FR-[DOMAIN]-###`

Example:

`FR-CONN-012`

---

# 2. RULE PRECEDENCE

When rules conflict, apply them in the following order:

1. Safety
2. Legal/Compliance
3. Account Restrictions
4. Block Relationships
5. Privacy
6. Eligibility
7. Product Configuration
8. Subscription Entitlements
9. User Preferences
10. Ranking/Personalization

Example:

A premium subscriber may have access to verified-only discovery.

However, premium status can never override:

- a block;
- suspension;
- dating incompatibility;
- privacy suppression.

---

# 3. CORE SYSTEM PRINCIPLE

Client applications must never be considered the authority for business rules.

The backend must independently enforce:

- authentication;
- authorization;
- account status;
- dating eligibility;
- privacy;
- block relationships;
- connection limits;
- event eligibility;
- subscription entitlements;
- moderation restrictions.

The UI may hide an action, but hidden UI is not sufficient security.

---

# PART II — ACCOUNT & IDENTITY RULES

# BR-AUTH-001 — Minimum Age

User must be at least 18 years old.

Enforcement:

- onboarding;
- backend account creation;
- dating;
- event eligibility where age matters.

Failure:

account creation blocked.

Priority:
Critical.

---

# BR-AUTH-002 — Mandatory Phone Verification

Every active consumer account must have one verified phone number.

Social login does not remove this requirement.

---

# BR-AUTH-003 — Phone Uniqueness

A verified phone number may belong to only one active user account unless approved account-recovery logic explicitly handles reassignment.

---

# BR-AUTH-004 — OTP Expiration

OTP codes expire after configurable duration.

Recommended default:

5 minutes.

---

# BR-AUTH-005 — OTP Attempt Limit

Maximum failed verification attempts must be limited.

Recommended initial threshold:

5 attempts per OTP challenge.

After threshold:

- invalidate challenge;
- require new challenge;
- trigger abuse controls.

---

# BR-AUTH-006 — OTP Resend Cooldown

Recommended initial resend cooldown:

30 seconds.

Repeated resends trigger progressively stricter limits.

---

# BR-AUTH-007 — Account Session Requirement

All protected endpoints require a valid authenticated session.

---

# BR-AUTH-008 — Refresh Token Rotation

If refresh tokens are used:

- refresh tokens must rotate;
- compromised/reused refresh tokens may invalidate the session chain.

---

# BR-AUTH-009 — Logout

Logout must invalidate or revoke session material according to architecture.

Local token deletion alone is insufficient where revocation is supported.

---

# BR-AUTH-010 — Account Status Enforcement

Permitted status values:

- ACTIVE
- PENDING_VERIFICATION
- LIMITED
- UNDER_REVIEW
- SUSPENDED
- BANNED
- DEACTIVATED
- DELETION_PENDING
- DELETED

Every protected API must account for user status where relevant.

---

# BR-AUTH-011 — Banned User

A banned user must not access regular product functionality.

Allowed:

- limited appeal/support route;
- logout.

---

# BR-AUTH-012 — Suspended User

Suspended users cannot:

- discover;
- connect;
- message;
- RSVP;
- modify social interactions.

Support access may remain available.

---

# BR-AUTH-013 — Deactivated User

A deactivated account:

- is hidden from discovery;
- cannot receive new requests;
- cannot be newly messaged;
- may be reactivated upon valid sign-in.

---

# BR-AUTH-014 — Deleted User

Deleted accounts must not remain discoverable.

Personal data is deleted/anonymized according to retention policy.

---

# PART III — PROFILE RULES

# BR-PROF-001 — Public Display Name

V1 primarily displays first name.

Legal surname should not be required for public display.

---

# BR-PROF-002 — Minimum Profile Completeness for Discovery

To appear in discovery, account must have:

- verified phone;
- valid age;
- first name;
- city/metro;
- at least one approved photo;
- at least one active intent;
- at least three interests;
- at least one language;
- ACTIVE status;
- discovery enabled.

---

# BR-PROF-003 — Photo Minimum

At least one approved profile photo is required for active discovery.

---

# BR-PROF-004 — Photo Maximum

Maximum active profile photos:

6.

---

# BR-PROF-005 — Primary Photo

Exactly one active photo must be designated primary.

---

# BR-PROF-006 — Photo Moderation

Photos may not contain:

- nudity;
- explicit sexual content;
- advertisements;
- QR codes;
- phone numbers;
- email addresses;
- overt contact solicitation;
- impersonation material.

---

# BR-PROF-007 — Bio Maximum

Bio maximum:

300 characters.

---

# BR-PROF-008 — Introductory Contact Information

Bio and pre-connection profile fields must not be used to bypass consent-based messaging.

Phone numbers, emails and URLs may be blocked or moderated.

---

# BR-PROF-009 — Interest Minimum

Minimum selected interests for activation:

3.

---

# BR-PROF-010 — Interest Taxonomy

V1 interests must reference controlled taxonomy identifiers.

Free-form interests do not participate in ranking.

---

# BR-PROF-011 — Language Minimum

Minimum languages:

1.

---

# BR-PROF-012 — Profile Completion

Profile completion is informational and ranking-related.

It does not override safety/privacy rules.

---

# PART IV — LOCATION RULES

# BR-LOC-001 — Exact Location Privacy

Exact coordinates must never be publicly exposed.

---

# BR-LOC-002 — Public Location

Public location may expose:

- city;
- metro;
- approximate distance.

---

# BR-LOC-003 — GPS Optionality

GPS permission is optional.

Manual city selection must allow product use.

---

# BR-LOC-004 — Distance Display

If user disables approximate-distance visibility, public profile must not display numeric distance.

Backend may still use approximate location for ranking where permitted by policy.

---

# BR-LOC-005 — Location Age

Location data should have freshness metadata.

If stale beyond configurable threshold, app may prompt user to confirm location.

---

# BR-LOC-006 — Initial Market Constraint

V1 primary market is DFW.

Users outside supported geography may:

- register if product permits;
- enter waitlist;
- receive limited experience.

This is feature-configurable.

---

# PART V — INTENT RULES

# BR-INT-001 — Minimum Intent

Each active profile requires at least one connection intent.

---

# BR-INT-002 — Supported Intents

V1:

- FRIENDSHIP
- ACTIVITIES
- NETWORKING
- DATING

Dating sub-intents:

- CASUAL_DATING
- SERIOUS_RELATIONSHIP

---

# BR-INT-003 — Multi-Intent

A user may select multiple compatible intents.

---

# BR-INT-004 — Intent Context

Discovery, connection reasons and recommendations must respect current selected intent.

---

# BR-INT-005 — Intent Visibility

Only relevant shared/mutually appropriate intents should be displayed in sensitive contexts.

---

# PART VI — DATING RULES

# BR-DATE-001 — Explicit Opt-In

Dating requires explicit user opt-in.

---

# BR-DATE-002 — Dating Consent Record

The system must persist:

- user ID;
- consent timestamp;
- policy/version;
- active/inactive state.

---

# BR-DATE-003 — Dating Eligibility

A user is dating-eligible only if:

- age >=18;
- ACTIVE account;
- dating enabled;
- valid dating preferences;
- discovery enabled;
- not restricted;
- qualifying profile completeness.

---

# BR-DATE-004 — Mutual Dating Eligibility

User A may appear to User B in dating discovery only when both are mutually eligible under configured gender/orientation/preferences.

---

# BR-DATE-005 — Dating Opt-Out

Turning dating off must immediately remove the user from future dating discovery.

---

# BR-DATE-006 — Existing Connections After Opt-Out

Turning dating off does not automatically delete existing connections or conversations.

---

# BR-DATE-007 — Dating Reason Restriction

Dating connection reasons may only be used when both users are dating-eligible and mutually compatible.

---

# BR-DATE-008 — Dating Privacy

Dating status must not be publicly exposed in unrelated social contexts unless explicitly designed and consented.

---

# BR-DATE-009 — Dating Event Eligibility

Dating-specific events may require:

- dating opt-in;
- age criteria;
- additional event-specific criteria.

Eligibility must be enforced server-side.

---

# BR-DATE-010 — Dating Safety Override

Dating premium benefits never override:

- blocks;
- user privacy;
- request limits imposed for abuse;
- suspension;
- moderation restrictions.

---

# PART VII — DISCOVERY ELIGIBILITY

# BR-DISC-001 — Discovery Prerequisites

A user is discovery-eligible only if:

- account ACTIVE;
- onboarding complete;
- profile meets minimum completeness;
- at least one approved photo;
- discoverable=true;
- not administratively restricted.

---

# BR-DISC-002 — Block Exclusion

If either party has blocked the other, neither may discover the other.

---

# BR-DISC-003 — Self Exclusion

A user may never discover their own profile.

---

# BR-DISC-004 — Suspended Exclusion

Suspended/banned/deleted/deactivated users must never appear in discovery.

---

# BR-DISC-005 — Dating Exclusion

Dating discovery requires BR-DATE mutual eligibility.

---

# BR-DISC-006 — Prior Decline Suppression

Profiles associated with declined requests may be suppressed for configurable duration.

Recommended:

30 days.

---

# BR-DISC-007 — Repeated Impression Suppression

Repeatedly showing the same ignored profile should be capped.

Configurable frequency limits required.

---

# BR-DISC-008 — Incompatible Intent Exclusion

If the active discovery mode requires an intent not supported by both parties, profile is excluded.

---

# BR-DISC-009 — Geography

Discovery must respect maximum distance and market rules.

---

# BR-DISC-010 — Verification Filter

Verified-only filter requires:

- entitlement if premium;
- target verified status.

---

# BR-DISC-011 — Ranking Is Not Authorization

Ranking score only orders eligible profiles.

Eligibility must be determined first.

---

# BR-DISC-012 — Ranking Inputs

Initial permissible ranking inputs:

- shared intent;
- shared interests;
- proximity;
- language overlap;
- verification;
- profile completeness;
- recent activity;
- prior interaction state.

---

# BR-DISC-013 — Ranking Configuration

Weights must be externally configurable.

No hard-coded ranking coefficients in mobile client.

---

# BR-DISC-014 — No Sensitive Ranking

V1 ranking must not use undisclosed sensitive factors such as:

- religion;
- caste;
- immigration status;
- exact address;
- financial status.

---

# BR-DISC-015 — Discovery Pause

If discoverable=false:

- profile must not appear in new discovery;
- existing connections remain;
- messaging continues.

---

# PART VIII — CONNECTION REQUEST RULES

# BR-CONN-001 — Consent-Based Communication

A user cannot initiate unrestricted chat with a stranger.

A connection request is required.

---

# BR-CONN-002 — Request Eligibility

A request can be sent only if:

- both accounts eligible;
- sender ACTIVE;
- target discoverable or otherwise requestable;
- no block exists;
- no existing connection exists;
- no duplicate pending request exists;
- request reason valid;
- applicable intent compatible;
- rate limit not exceeded.

---

# BR-CONN-003 — Intro Message Maximum

Optional intro:

200 characters.

---

# BR-CONN-004 — Connection Reason Required

Every request requires a reason code.

---

# BR-CONN-005 — Valid Reason Context

Available reasons depend on intent compatibility.

Example:

DATING reason cannot be used if either party has dating disabled.

---

# BR-CONN-006 — Standard Daily Request Limit

Initial configurable free-user default:

10 new outgoing requests per rolling/calendar day.

Implementation decision must choose one consistent definition.

Recommended:
calendar day in user/server-configured timezone.

---

# BR-CONN-007 — Safety Limit Independence

Premium plans may increase ordinary request limits.

However, abuse-based rate limits always override premium entitlement.

---

# BR-CONN-008 — Request Expiration

Default request expiration:

14 days.

---

# BR-CONN-009 — Request States

Valid:

- PENDING
- ACCEPTED
- DECLINED
- CANCELLED
- EXPIRED
- INVALIDATED

---

# BR-CONN-010 — Sender Cancellation

Pending sender may cancel request before acceptance.

---

# BR-CONN-011 — Acceptance

Acceptance must atomically:

1. transition request to ACCEPTED;
2. create mutual connection;
3. create or activate conversation;
4. trigger notification;
5. emit analytics event.

---

# BR-CONN-012 — Decline Privacy

Sender must not receive explicit language such as:

> "User declined you."

Sender-facing state may simply become unavailable/closed.

---

# BR-CONN-013 — Block Invalidates Request

Blocking either party invalidates pending request immediately.

---

# BR-CONN-014 — Duplicate Requests

No multiple simultaneous requests between same users.

---

# BR-CONN-015 — Request Retry After Decline

Retry cooldown must be configurable.

Recommended V1:

30 days.

---

# BR-CONN-016 — Existing Connection

Connected users cannot send a new request to each other.

---

# PART IX — CONNECTION RELATIONSHIP RULES

# BR-REL-001 — Mutual Relationship

A connection is mutual.

There is no follower/following model in V1.

---

# BR-REL-002 — Connected Status

Connected status exists only after accepted request.

---

# BR-REL-003 — Disconnect

Either user may disconnect unilaterally.

---

# BR-REL-004 — Disconnect Effect

After disconnect:

- chat sending disabled;
- relationship no longer active;
- historical conversation retained/hidden according to policy.

---

# BR-REL-005 — Reconnection

Reconnection behavior must be configurable.

Recommended:

allow future new request unless blocked or safety-limited.

---

# BR-REL-006 — Block Supersedes Connection

Blocking automatically supersedes connection state.

---

# PART X — MESSAGING RULES

# BR-MSG-001 — Messaging Eligibility

Messaging allowed only if:

- active mutual connection;
- neither blocked;
- neither account messaging-restricted;
- conversation active.

---

# BR-MSG-002 — Message Length

Maximum:

2,000 characters.

---

# BR-MSG-003 — Empty Messages

Whitespace-only messages rejected.

---

# BR-MSG-004 — Idempotency

Message-send endpoint should support idempotency/client message identifier to prevent duplicate sends.

---

# BR-MSG-005 — Message Ownership

Users may access only conversations in which they are authorized participants.

---

# BR-MSG-006 — Block Effect

Block immediately prevents:

- send;
- receive;
- conversation reactivation.

---

# BR-MSG-007 — Disconnect Effect

Disconnect disables new sends.

---

# BR-MSG-008 — Message Retention

Retention must follow formal privacy/safety policy.

Do not allow engineering teams to invent retention independently.

---

# BR-MSG-009 — Image Messaging

Image messaging is disabled unless moderation and storage controls are production-ready.

Feature flag required.

---

# BR-MSG-010 — Message Reporting

Report flow may attach relevant message references.

---

# BR-MSG-011 — Moderation Access

Moderators should not have unrestricted access to all messages.

Access must be contextually limited to reported/safety-authorized evidence.

---

# PART XI — BLOCK RULES

# BR-BLOCK-001 — Immediate Effect

Block must be applied synchronously/atomically where possible.

---

# BR-BLOCK-002 — Mutual Discovery Suppression

Block relationship hides both parties from each other's discovery.

---

# BR-BLOCK-003 — Messaging Suppression

Blocked parties cannot message.

---

# BR-BLOCK-004 — Request Suppression

Blocked parties cannot send requests.

---

# BR-BLOCK-005 — Event Privacy

Block should prevent direct profile discovery through attendee lists where feasible.

---

# BR-BLOCK-006 — No Notification

Blocked user is not explicitly notified they were blocked.

---

# BR-BLOCK-007 — Unblock

Unblock does not:

- reconnect users;
- restore request;
- restore prior dating interest.

---

# BR-BLOCK-008 — Safety Preservation

Unblocking does not erase moderation/report history.

---

# PART XII — REPORTING RULES

# BR-REP-001 — Reporting Availability

Report must be available from:

- profile;
- conversation;
- event where relevant.

---

# BR-REP-002 — Report Categories

Controlled codes required.

---

# BR-REP-003 — Report Detail

Optional details:

max 1,000 chars.

---

# BR-REP-004 — Report Confidentiality

Reported user must not be told reporter identity.

---

# BR-REP-005 — High-Severity Escalation

High-severity categories trigger immediate priority escalation.

---

# BR-REP-006 — Abuse of Reporting

Malicious repeated false reporting may itself become a moderation signal.

---

# BR-REP-007 — Evidence Preservation

Relevant evidence should be preserved when a report is submitted according to safety/legal retention policy.

---

# PART XIII — EVENTS RULES

# BR-EVT-001 — Event Publishers

Only:

- admins;
- approved organizers

can publish public V1 events.

---

# BR-EVT-002 — Event Required Fields

Required:

- title;
- description;
- category;
- start;
- end;
- location/venue;
- organizer;
- capacity or unlimited flag;
- visibility;
- status.

---

# BR-EVT-003 — Event Time

End time must be after start time.

---

# BR-EVT-004 — Event Publication

Event cannot be publicly published in invalid state.

---

# BR-EVT-005 — Event Capacity

If capacity reached:

- RSVP closes;
- waitlist may activate if enabled.

---

# BR-EVT-006 — RSVP Eligibility

User must:

- be ACTIVE;
- satisfy event eligibility;
- not be blocked from event/organizer by moderation;
- not already RSVP'd.

---

# BR-EVT-007 — RSVP Uniqueness

One active RSVP per user/event.

---

# BR-EVT-008 — RSVP States

- GOING
- WAITLISTED
- CANCELLED

---

# BR-EVT-009 — Attendee Privacy

Identity of attendees may only be exposed when:

- feature enabled;
- event allows it;
- attendee allows it;
- viewer eligible.

---

# BR-EVT-010 — Dating Event

Attendance at dating event does not authorize direct messaging.

Normal connection rules still apply.

---

# BR-EVT-011 — Event Cancellation

Cancellation must:

- prevent new RSVPs;
- notify RSVP'd users;
- mark event cancelled;
- preserve audit history.

---

# BR-EVT-012 — Organizer Revocation

Revoked organizer cannot publish new events.

Existing events become admin-managed or suspended based on policy.

---

# PART XIV — NOTIFICATION RULES

# BR-NOT-001 — Notification Categories

Required categories:

- connection;
- messages;
- events;
- account/security;
- marketing.

---

# BR-NOT-002 — User Preference

Non-critical notifications respect user settings.

---

# BR-NOT-003 — Security Notifications

Critical security/account notices may bypass optional marketing-style preferences.

---

# BR-NOT-004 — Connection Acceptance Notification

Notify sender when request accepted.

---

# BR-NOT-005 — Decline Notification

Do not send explicit decline push.

---

# BR-NOT-006 — Block Notification

No block notification.

---

# BR-NOT-007 — Event Cancellation

All affected RSVP users receive cancellation notification.

---

# BR-NOT-008 — Deep Linking

Notification must route only to content user is authorized to view.

---

# PART XV — SUBSCRIPTION & ENTITLEMENT RULES

# BR-SUB-001 — Free Utility

Core network must remain functional for free users.

---

# BR-SUB-002 — Safety Never Premium

Never paywall:

- block;
- report;
- privacy basics;
- account deletion;
- safety notices.

---

# BR-SUB-003 — Server-Side Entitlement

Premium access determined by backend entitlement, not client flag.

---

# BR-SUB-004 — Receipt Validation

Store transaction/receipt must be validated according to platform architecture.

---

# BR-SUB-005 — Expired Subscription

After entitlement expiry:

- premium features removed;
- account remains active;
- existing data preserved where appropriate.

---

# BR-SUB-006 — Advanced Filters

Premium filter availability is entitlement-controlled.

---

# BR-SUB-007 — Higher Request Limit

Premium may receive higher ordinary request limit.

Example:

Free: 10/day  
Plus: configurable 25/day

Final numbers remain configuration, not code constants.

---

# BR-SUB-008 — Abuse Limit

Fraud/spam throttles override paid limits.

---

# BR-SUB-009 — Restore Purchase

Eligible purchases must support restoration.

---

# BR-SUB-010 — Billing Failure

Billing failure should not immediately corrupt user state.

Entitlement provider state determines grace/retry behavior.

---

# PART XVI — PRIVACY RULES

# BR-PRIV-001 — Data Minimization

Collect only necessary V1 data.

---

# BR-PRIV-002 — Sensitive Data Exclusion

Do not collect in V1 unless separately approved:

- visa status;
- immigration status;
- exact home address;
- government ID;
- caste;
- financial status.

---

# BR-PRIV-003 — Public Contact Data

Never publicly display:

- phone;
- email;
- exact address.

---

# BR-PRIV-004 — Discovery Preference

User can pause discovery.

---

# BR-PRIV-005 — Distance Preference

User may suppress distance display.

---

# BR-PRIV-006 — Event Attendance

Attendance identity controlled by privacy setting.

---

# BR-PRIV-007 — Account Deletion

Deletion request must result in defined delete/anonymize workflow.

---

# BR-PRIV-008 — Analytics

Analytics events must not include private-message text.

---

# PART XVII — MODERATION RULES

# BR-MOD-001 — Moderation Roles

Initial:

- SUPER_ADMIN
- MODERATOR
- EVENT_MANAGER
- SUPPORT_AGENT

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-10, R-07:** `SUPPORT_AGENT` added per the Authorization Spec. All staff roles require MFA.

---

# BR-MOD-002 — Least Privilege

Moderators access only required functions.

---

# BR-MOD-003 — Enforcement Audit

Every enforcement action must store:

- actor;
- target;
- action;
- reason;
- timestamp;
- evidence reference;
- prior state;
- resulting state.

---

# BR-MOD-004 — Permanent Ban

Permanent ban requires authorized role.

---

# BR-MOD-005 — Moderator Notes

Internal notes are not visible to end users.

---

# BR-MOD-006 — Safety Evidence

Moderators may view only appropriately scoped evidence.

---

# BR-MOD-007 — Admin Actions Server-Side

No admin privilege is trusted from client-only UI.

---

# PART XVIII — FEATURE FLAG RULES

# BR-FLAG-001 — Server-Managed

Material product flags must be server managed.

---

# BR-FLAG-002 — Initial Flags

At minimum:

- dating;
- premium;
- selfie verification;
- attendee discovery;
- image messaging;
- experimental discovery.

---

# BR-FLAG-003 — Kill Switch

High-risk features should support rapid disabling.

---

# BR-FLAG-004 — Flag Audit

Admin flag changes must be auditable.

---

# PART XIX — ANALYTICS RULES

# BR-ANA-001 — No Sensitive Payload

Events may not capture:

- auth token;
- password;
- OTP;
- message body;
- precise location unless specifically approved.

---

# BR-ANA-002 — Meaningful Connection

Count when:

1. request accepted;
2. one user sends message;
3. other user responds.

Count once per connection relationship.

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-08:** messages must be persisted and the reciprocal exchange must occur within 7 days of acceptance. Canonical event: `meaningful_connection_created`.

---

# BR-ANA-003 — Activation

Activated user requires:

- account complete;
- >=70% profile;
- >=1 intent;
- >=3 interests;
- discovery viewed;
- >=1 connection request or event RSVP.

---

# BR-ANA-004 — Funnel Consistency

Identifiers must permit funnel analysis without exposing PII.

---

# PART XX — FUNCTIONAL REQUIREMENTS MATRIX

---

# AUTHENTICATION REQUIREMENTS

| ID | Requirement | Priority | Screen(s) | Backend | Acceptance |
|---|---|---|---|---|---|
| FR-AUTH-001 | System shall allow signup by verified mobile phone | P0 | A04/A04B | auth OTP | valid phone completes verification |
| FR-AUTH-002 | System shall reject users under 18 | P0 | A03 | account service | no account created |
| FR-AUTH-003 | System shall rate-limit OTP abuse | P0 | A04/A04B | auth/risk | excessive requests blocked |
| FR-AUTH-004 | System shall preserve incomplete onboarding | P0 | O-series | user service | resume at correct step |
| FR-AUTH-005 | System shall enforce account status at API layer | P0 | global | auth middleware | suspended user cannot transact |
| FR-AUTH-006 | System shall support secure logout | P0 | P21 | auth | session invalidated |

---

# PROFILE REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-PROF-001 | User shall upload 1–6 profile photos | P0 | seventh photo rejected |
| FR-PROF-002 | One primary photo shall exist | P0 | primary always defined |
| FR-PROF-003 | Photo moderation shall run before public display | P0 | rejected media never public |
| FR-PROF-004 | User shall select >=3 interests | P0 | onboarding blocked below 3 |
| FR-PROF-005 | User shall select >=1 language | P0 | onboarding blocked below 1 |
| FR-PROF-006 | Bio shall be <=300 chars | P0 | invalid save rejected |
| FR-PROF-007 | Public profile shall not expose phone/email | P0 | fields absent in API response |
| FR-PROF-008 | Profile shall expose verification badge | P1 | verified state visible |
| FR-PROF-009 | User shall control selected privacy fields | P0 | hidden attributes excluded |

---

# INTENT/DATING REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-INT-001 | User must choose >=1 intent | P0 | cannot finish without intent |
| FR-DATE-001 | Dating requires explicit consent | P0 | no consent=no dating discovery |
| FR-DATE-002 | User may disable Dating immediately | P0 | profile disappears from dating candidates |
| FR-DATE-003 | Only mutually eligible users appear in Dating | P0 | incompatible profiles excluded |
| FR-DATE-004 | Dating reason available only where compatible | P0 | reason hidden/rejected |
| FR-DATE-005 | Existing connections survive dating opt-out | P0 | chat remains unless disconnected |

---

# DISCOVERY REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-DISC-001 | Discovery shall return only eligible profiles | P0 | excluded-state users absent |
| FR-DISC-002 | Block relationships shall be respected | P0 | blocked profiles impossible to retrieve |
| FR-DISC-003 | Discovery shall support cursor pagination | P0 | stable paging |
| FR-DISC-004 | Ranking shall use configurable factors | P0 | weights update without client release |
| FR-DISC-005 | Discovery shall support mode filtering | P0 | Friends/Activities/etc. |
| FR-DISC-006 | Discovery shall support geography | P0 | max distance respected |
| FR-DISC-007 | Discovery shall support language/interests filtering | P0 | results meet selected values |
| FR-DISC-008 | Verified-only may be premium | P1 | unauthorized user cannot use |
| FR-DISC-009 | Pause Discovery shall suppress profile | P0 | profile removed immediately |
| FR-DISC-010 | Exact location shall never be returned | P0 | no exact coordinates in public API |

---

# CONNECTION REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-CONN-001 | Stranger messaging shall be prohibited | P0 | direct conversation create rejected |
| FR-CONN-002 | Request reason shall be mandatory | P0 | missing reason rejected |
| FR-CONN-003 | Intro shall be <=200 chars | P0 | oversized request rejected |
| FR-CONN-004 | Daily request limit shall be enforced | P0 | excess request blocked |
| FR-CONN-005 | Duplicate pending request shall be prohibited | P0 | duplicate rejected |
| FR-CONN-006 | Request shall expire after configured period | P0 | expired cannot accept |
| FR-CONN-007 | Sender may cancel pending request | P0 | state CANCELLED |
| FR-CONN-008 | Recipient may accept or decline | P0 | state changes valid |
| FR-CONN-009 | Acceptance shall create mutual connection atomically | P0 | no partial state |
| FR-CONN-010 | Sender shall not receive explicit rejection message | P0 | no decline notification |
| FR-CONN-011 | Block shall invalidate request | P0 | request no longer actionable |

---

# MESSAGING REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-MSG-001 | Only connected users may message | P0 | unauthorized send fails |
| FR-MSG-002 | Messages shall support realtime delivery | P0 | normal delivery within target |
| FR-MSG-003 | Messages shall support failure/retry state | P0 | failed clearly visible |
| FR-MSG-004 | Message maximum 2,000 chars | P0 | longer rejected |
| FR-MSG-005 | Block shall immediately disable chat | P0 | send denied |
| FR-MSG-006 | Disconnect shall disable new messages | P0 | composer unavailable |
| FR-MSG-007 | User shall access only their conversations | P0 | IDOR attempts rejected |
| FR-MSG-008 | Image messaging feature shall be flag-controlled | P1 | disabled by default if not ready |

---

# SAFETY REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-SAFE-001 | User shall block another user | P0 | interaction immediately disabled |
| FR-SAFE-002 | User shall report profile/conversation | P0 | report created |
| FR-SAFE-003 | Reports shall support controlled categories | P0 | valid code required |
| FR-SAFE-004 | High-severity reports shall escalate | P0 | queue priority set |
| FR-SAFE-005 | Reporter identity shall remain private | P0 | subject cannot retrieve |
| FR-SAFE-006 | Safety actions shall not require subscription | P0 | free users fully supported |
| FR-SAFE-007 | Admin enforcement shall be audited | P0 | audit row generated |

---

# EVENT REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-EVT-001 | Approved organizer/admin may publish event | P0 | regular users denied |
| FR-EVT-002 | Event shall enforce valid date/time | P0 | end<=start rejected |
| FR-EVT-003 | User may RSVP once | P0 | duplicate denied |
| FR-EVT-004 | Capacity shall be enforced | P0 | no overbooking unless waitlist |
| FR-EVT-005 | Cancelled event shall notify attendees | P0 | notification generated |
| FR-EVT-006 | Attendee visibility shall respect privacy | P1 | hidden attendees absent |
| FR-EVT-007 | Dating event shall not imply messaging consent | P0 | connection still required |
| FR-EVT-008 | RSVP shall require ACTIVE account | P0 | suspended users denied |

---

# NOTIFICATION REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-NOT-001 | New request shall notify recipient | P0 | push/in-app created |
| FR-NOT-002 | Accepted request shall notify sender | P0 | correct deep link |
| FR-NOT-003 | Decline shall not send rejection notification | P0 | none generated |
| FR-NOT-004 | New message shall notify according to preference | P0 | muted/preference respected |
| FR-NOT-005 | Event cancellation shall notify RSVP users | P0 | all eligible recipients |
| FR-NOT-006 | Notification deep link shall verify access | P0 | unauthorized navigation blocked |

---

# PRIVACY REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-PRIV-001 | User may suppress approximate-distance display | P0 | field hidden |
| FR-PRIV-002 | User may pause discovery | P0 | no new impressions |
| FR-PRIV-003 | Phone/email shall remain non-public | P0 | omitted from public endpoints |
| FR-PRIV-004 | Event attendance visibility shall be controllable | P1 | setting enforced |
| FR-PRIV-005 | User may deactivate account | P0 | hidden but recoverable |
| FR-PRIV-006 | User may request account deletion | P0 | deletion workflow initiated |
| FR-PRIV-007 | Analytics shall exclude private message text | P0 | payload validation |

---

# SUBSCRIPTION REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-SUB-001 | Free users shall retain core utility | P0 | discovery/connect/chat functional |
| FR-SUB-002 | Premium entitlement shall be server-backed | P0 | client spoof fails |
| FR-SUB-003 | System shall support purchase validation | P1 | valid purchase grants entitlement |
| FR-SUB-004 | System shall support restore purchase | P1 | entitlement restored |
| FR-SUB-005 | Premium expiry shall remove benefits only | P1 | base account remains |
| FR-SUB-006 | Abuse limits shall override subscription | P0 | premium spam still blocked |

---

# ADMIN REQUIREMENTS

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-ADM-001 | Admin access shall use RBAC | P0 | unauthorized tools hidden/rejected |
| FR-ADM-002 | Moderator may review reports | P0 | report queue accessible |
| FR-ADM-003 | Event manager may manage events | P0 | no unrelated user enforcement |
| FR-ADM-004 | Super admin may manage account states | P0 | audited |
| FR-ADM-005 | Enforcement reason shall be required | P0 | action blocked without reason |
| FR-ADM-006 | Feature flag changes shall be auditable | P1 | history available |

---

# PART XXI — DECISION TABLE: WHO CAN SEE WHOM?

A viewer can see target only if all mandatory gates pass.

| Gate | Required |
|---|---|
| Viewer ACTIVE | Yes |
| Target ACTIVE | Yes |
| Target discovery enabled | Yes |
| No block either direction | Yes |
| Target profile complete | Yes |
| Geographic eligibility | Yes |
| Mode/intent compatibility | Yes |
| Dating mutual eligibility when Dating mode | Yes |
| Moderator restriction absent | Yes |

Then ranking applies.

---

# PART XXII — DISCOVERY PSEUDORULE

```text id="mc24rh"
IF viewer.account_status != ACTIVE
    RETURN no discovery

candidate pool =
    ACTIVE
    AND discoverable
    AND profile_complete
    AND approved_photo_exists

EXCLUDE:
    self
    blocked relationships
    restricted users
    incompatible mode/intent
    incompatible dating candidates
    geography violations
    recently declined/suppressed users

SCORE remaining candidates

RETURN ordered cursor page
```

---

# PART XXIII — CONNECTION REQUEST DECISION TABLE

Request allowed only when:

| Rule | Must Pass |
|---|---|
| Sender ACTIVE | Yes |
| Recipient ACTIVE | Yes |
| No block | Yes |
| Not already connected | Yes |
| No pending request | Yes |
| Request reason valid | Yes |
| Intent compatible | Yes |
| Dating compatible if relevant | Yes |
| Under request limit | Yes |
| Not abuse-throttled | Yes |

Failure must return a normalized domain error rather than exposing internal logic.

---

# PART XXIV — BLOCK PRECEDENCE MATRIX

If block exists:

| Capability | Result |
|---|---|
| Discovery | Denied |
| Profile Detail | Denied/limited |
| New Request | Denied |
| Pending Request | Invalidated |
| Messaging | Denied |
| Event Attendee Discovery | Hidden where feasible |
| Existing Connection | Inactive |
| Notification | Suppressed |
| Report History | Preserved |

---

# PART XXV — ACCOUNT STATUS CAPABILITY MATRIX

| Capability | Active | Limited | Review | Suspended | Banned | Deactivated |
|---|---:|---:|---:|---:|---:|---:|
| Sign In | ✓ | ✓ | ✓ | ✓ limited | ✓ limited | ✓ reactivate |
| Discovery | ✓ | configurable | ✕ | ✕ | ✕ | ✕ |
| Connect | ✓ | configurable | ✕ | ✕ | ✕ | ✕ |
| Message | ✓ | configurable | configurable | ✕ | ✕ | ✕ |
| RSVP | ✓ | configurable | ✕ | ✕ | ✕ | ✕ |
| Edit Profile | ✓ | ✓ | limited | limited | ✕ | ✕ |
| Support | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Delete Account | ✓ | ✓ | ✓ | ✓ | policy | ✓ |

---

# PART XXVI — FREE VS PREMIUM MATRIX

Initial product intent:

| Feature | Free | Plus |
|---|---:|---:|
| Profile | ✓ | ✓ |
| Discovery | ✓ | ✓ |
| Basic Filters | ✓ | ✓ |
| Connection Requests | Limited | Higher Limit |
| Messaging After Connection | ✓ | ✓ |
| Events | ✓ | ✓ |
| Report/Block | ✓ | ✓ |
| Advanced Filters | ✕ | ✓ |
| Verified-Only Filter | ✕ | ✓ |
| Travel Mode | ✕/Future | Future |
| Profile Insights | ✕ | Candidate |
| Boosts | Add-on/Future | Add-on/Future |

This matrix is configurable.

---

# PART XXVII — DOMAIN ERROR CATALOG

Backend should use stable machine-readable codes.

Examples:

```text id="3a6p0q"
ACCOUNT_NOT_ACTIVE
PROFILE_INCOMPLETE
PHONE_NOT_VERIFIED
AGE_NOT_ELIGIBLE
DISCOVERY_DISABLED
BLOCK_RELATIONSHIP_EXISTS
TARGET_NOT_AVAILABLE
INTENT_NOT_COMPATIBLE
DATING_NOT_ENABLED
DATING_NOT_COMPATIBLE
REQUEST_ALREADY_EXISTS
ALREADY_CONNECTED
REQUEST_LIMIT_REACHED
REQUEST_EXPIRED
CONVERSATION_NOT_AUTHORIZED
EVENT_FULL
EVENT_NOT_ELIGIBLE
SUBSCRIPTION_REQUIRED
RATE_LIMITED
CONTENT_REJECTED
```

Mobile maps these codes to approved UX copy.

Do not expose database or infrastructure error messages.

---

# PART XXVIII — CONFIGURATION CATALOG

The following must be configuration-driven:

- daily connection limit;
- premium connection limit;
- request expiration;
- retry cooldown after decline;
- maximum discovery distance;
- supported cities;
- ranking weights;
- interest taxonomy;
- event categories;
- report categories;
- account restriction thresholds;
- feature flags;
- subscription entitlements;
- onboarding copy where feasible.

---

# PART XXIX — TRANSACTIONAL INTEGRITY REQUIREMENTS

Atomic operations required for:

## Accept Connection

Must atomically:

- verify request still pending;
- update request;
- create connection;
- create conversation;
- enqueue notification/event.

No state such as:

accepted request but no connection.

---

## Block User

Must consistently:

- create block relationship;
- invalidate requests;
- disable connection;
- stop messaging authorization.

---

## Event RSVP

Must prevent race conditions around capacity.

Use transactional capacity handling.

---

## Subscription Entitlement

Receipt validation and entitlement update should be idempotent.

---

# PART XXX — CONCURRENCY RULES

System must handle:

- two users accepting/cancelling same request near-simultaneously;
- duplicate message submissions;
- duplicate RSVP;
- simultaneous last-seat event RSVP;
- repeated payment webhook delivery;
- repeated report submit taps.

Use:

- idempotency;
- unique constraints;
- transactions;
- optimistic/pessimistic locking where appropriate.

---

# PART XXXI — AUDIT REQUIREMENTS

Audit required for:

- moderation actions;
- account state changes by staff;
- organizer approval;
- feature flag changes;
- event cancellation by admin;
- sensitive privacy/admin configuration;
- subscription entitlement manual overrides.

Audit record should contain:

- actor;
- action;
- object;
- timestamp;
- before state;
- after state;
- reason;
- correlation ID.

---

# PART XXXII — NON-FUNCTIONAL BUSINESS ENFORCEMENT

## Security

Rules must be enforced server-side.

## Performance

Business-rule evaluation should avoid N+1 request patterns in discovery.

## Availability

Temporary analytics failure must not block primary user interaction.

## Observability

Critical rule failures must produce structured logs.

---

# PART XXXIII — QA TRACEABILITY MODEL

Every requirement should eventually map to:

```text id="cbw9zc"
Requirement ID
↓
User Story
↓
Screen
↓
API Endpoint
↓
Business Rule
↓
Automated Test
↓
Manual QA Case
↓
Analytics Verification
```

Example:

```text id="l1lyx3"
FR-CONN-009
↓
Accept Connection
↓
C03
↓
POST /connections/requests/{id}/accept
↓
BR-CONN-011
↓
Integration Test
↓
E2E Test
↓
connection_accepted event
```

---

# PART XXXIV — P0 AUTOMATED BUSINESS RULE TESTS

The following are mandatory automated tests.

## Discovery

- blocked user excluded;
- suspended user excluded;
- paused user excluded;
- dating-off user excluded from dating;
- intent incompatibility excluded;
- exact coordinates not returned.

## Connections

- stranger cannot DM;
- duplicate request rejected;
- daily limit enforced;
- blocked target rejected;
- invalid dating request rejected;
- expired request cannot accept;
- acceptance atomic.

## Messaging

- only participants access conversation;
- disconnected cannot send;
- blocked cannot send;
- duplicate client message id not duplicated.

## Events

- unapproved user cannot publish;
- capacity enforced;
- duplicate RSVP rejected;
- suspended user cannot RSVP.

## Privacy

- phone never public;
- email never public;
- exact location never public.

## Subscription

- spoofed client premium ignored;
- expired entitlement removes premium;
- safety remains available.

---

# PART XXXV — SECURITY ABUSE CASES

Engineering must test:

### Enumeration

Attacker attempts sequential user IDs.

Expected:
authorization/privacy safe.

### IDOR

Attacker requests another conversation ID.

Expected:
403/404 domain-safe rejection.

### Request Flood

Attacker sends hundreds of connection requests.

Expected:
rate-limited/risk restricted.

### OTP Flood

Expected:
phone/IP/device throttling.

### Block Bypass

Attacker attempts direct API call after block.

Expected:
server rejects.

### Dating Bypass

Dating-disabled user calls dating endpoint directly.

Expected:
server rejects.

### Premium Spoof

Client modifies local entitlement.

Expected:
no premium backend access.

### Event Capacity Race

Two users claim last slot.

Expected:
only one successful where capacity requires.

---

# PART XXXVI — POLICY DECISIONS REQUIRING FUTURE EXECUTIVE APPROVAL

These are intentionally unresolved and must not be invented by engineering:

1. Exact free/premium connection limits after initial experiment.
2. Exact pricing.
3. Whether profile visitors become premium.
4. Whether read receipts become premium.
5. Whether image messaging launches in V1.
6. Exact selfie verification vendor.
7. Exact message retention duration.
8. Exact deleted-user data retention where legally required.
9. Exact dating gender/orientation taxonomy.
10. Exact event ticketing architecture.
11. Whether paid event commission launches in V1.
12. Exact account appeal workflow.
13. Exact moderation SLA.
14. Exact fraud/risk provider.
15. Expansion geography after DFW.

---

# PART XXXVII — RULES CLAUDE CODE MAY NOT CHANGE

Claude Code must not autonomously alter:

- age eligibility;
- consent-before-messaging;
- dating opt-in;
- block semantics;
- safety availability;
- public location precision;
- user privacy;
- subscription validation;
- moderation authorization;
- account deletion behavior;
- admin permissions.

Any requested code change that affects these areas must reference a formal product/architecture decision.

---

# PART XXXVIII — DEFINITION OF FUNCTIONALLY COMPLETE

A feature is not considered functionally complete unless:

1. UI exists.
2. backend operation exists.
3. business rules enforced server-side.
4. authorization tested.
5. error states handled.
6. analytics emitted.
7. audit added where required.
8. notification behavior defined.
9. safety/privacy impact addressed.
10. automated tests pass.
11. QA acceptance criteria pass.

---

# PART XXXIX — CRITICAL MVP DEPENDENCY GRAPH

```text id="3zrbnm"
Identity
   ↓
Profile
   ↓
Intent
   ↓
Eligibility Engine
   ↓
Discovery
   ↓
Connection Request
   ↓
Relationship
   ↓
Messaging
   ↓
Meaningful Connection


Safety
 ├── Block
 ├── Report
 └── Moderation
      ↑
applies across all layers


Events
   ↓
RSVP
   ↓
Offline Discovery
   ↓
Connection Engine


Subscription
   ↓
Entitlements
   ↓
Enhances Discovery
but never overrides Safety/Privacy
```

---

# PART XL — IMPLEMENTATION ORDER

## Phase 1 — Rule Infrastructure

Implement:

- account status model;
- privacy model;
- block relationship;
- feature flags;
- configuration service;
- entitlement abstraction.

## Phase 2 — Eligibility Engine

Create centralized domain service responsible for:

- canDiscover();
- canViewProfile();
- canSendRequest();
- canAcceptRequest();
- canMessage();
- canRSVP();
- canUseDating();
- canUsePremiumFeature().

Do not duplicate these rules in multiple controllers.

## Phase 3 — Core Vertical Slice

Implement:

```text id="ksfza8"
Signup
→ Profile
→ Discovery
→ Request
→ Accept
→ Message
```

## Phase 4 — Safety

- block;
- report;
- moderation.

## Phase 5 — Events

- event discovery;
- RSVP;
- reminders.

## Phase 6 — Monetization

- subscription;
- entitlement.

---

# PART XLI — RECOMMENDED DOMAIN SERVICES

Architecture should expose business logic through domain-level services such as:

```text id="vuotn7"
EligibilityService

DiscoveryPolicyService

ConnectionPolicyService

DatingPolicyService

MessagingPolicyService

PrivacyPolicyService

SafetyPolicyService

EventEligibilityService

EntitlementService

ModerationPolicyService
```

Avoid putting rules directly into:

- React components;
- route handlers;
- database UI code.

---

# PART XLII — EXAMPLE ELIGIBILITY CONTRACT

Conceptual:

```text id="2wn5hm"
canSendConnectionRequest(
    actorUser,
    targetUser,
    reason,
    currentContext
)

returns:

{
    allowed: true/false,
    reasonCode: null | DOMAIN_ERROR,
    policyVersion: string
}
```

This creates consistent behavior across:

- mobile;
- backend jobs;
- admin tools;
- future web clients.

---

# PART XLIII — VERSIONING

Business-rule changes should have version control.

High-impact policy domains should optionally record policy version, especially:

- dating consent;
- privacy;
- moderation;
- premium entitlements.

---

# PART XLIV — FINAL PRODUCT CONTROL STATEMENT

This catalog establishes the operating logic of Project Connect V1.

The most important business constraints are:

> **Discovery is filtered by eligibility before ranking.**

> **Messaging is earned through mutual consent.**

> **Dating requires explicit mutual eligibility.**

> **Block and safety rules override every commercial entitlement.**

> **Privacy is enforced by the backend, not merely the UI.**

> **Premium improves convenience and discovery; it does not buy permission, safety exceptions, or access to people who have not consented.**

> **Local network quality takes precedence over feature breadth.**

This document must remain traceable to:

- product requirements;
- screens;
- APIs;
- QA tests;
- analytics;
- architecture.

No team should introduce hidden business logic outside this framework.

---

# NEXT ARTIFACTS

The correct sequence from this point is:

1. **Detailed Data Model + Data Dictionary**
2. **Role & Permission Matrix**
3. **Trust & Safety Operating Specification**
4. **Notification Matrix**
5. **Analytics Tracking Specification**
6. **Design System Specification**
7. **Technical/System Architecture**
8. **Architecture Decision Records**
9. **Claude Code Engineering Constitution**
10. **Implementation Backlog / Epics / Stories**

The next artifact I recommend is the **Detailed Data Model + Data Dictionary**, because the approved PRD, screens and business rules now give us enough information to define every major entity, field, relationship, enum, index, privacy classification, retention rule and ownership boundary without guessing.