# V1 ROLE & PERMISSION MATRIX + AUTHORIZATION SPECIFICATION

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
Approved downstream artifact based on:
- V1 Product Requirements Document
- V1 Screen-by-Screen UX + Functional Specification
- V1 Business Rules Catalog + Functional Requirements Matrix
- V1 Detailed Data Model + Data Dictionary

---

# 1. PURPOSE

This document defines the complete V1 authorization model for Project Connect.

It governs:

- who may access which capabilities;
- who may access which resources;
- which conditions must be true before access is granted;
- which data attributes may be returned;
- which actions require elevated roles;
- which actions require ownership;
- which actions require explicit user consent;
- which actions require subscription entitlement;
- which actions require safety/moderation privileges;
- which actions require audit logging.

This document is the canonical authorization source of truth.

---

# 2. AUTHORIZATION PRINCIPLES

## 2.1 Server-Side Enforcement Is Mandatory

Authorization decisions must be enforced by the backend.

The mobile or web UI may hide unavailable actions, but the backend must independently reject unauthorized requests.

---

## 2.2 Authentication Is Not Authorization

A signed-in user is not automatically authorized to:

- view another person's private profile;
- access any conversation;
- update any event;
- read any report;
- manage any user;
- view billing details;
- access administrative functions.

Authentication answers:

> Who are you?

Authorization answers:

> Are you permitted to perform this action on this resource now?

---

## 2.3 Default Deny

All protected operations follow:

> **Deny unless explicitly allowed.**

The system must not rely on:

> "We forgot to block it."

---

## 2.4 Least Privilege

Each actor receives only the minimum permissions required.

A Moderator should not automatically gain:

- billing access;
- feature-flag access;
- subscription override;
- event-management rights;
- production configuration rights.

---

## 2.5 Resource-Level Authorization

Roles alone are insufficient.

Example:

A consumer has permission to read conversations.

But only conversations in which that user is an authorized participant.

Therefore authorization must evaluate:

```text
Actor
+
Role
+
Resource
+
Relationship to resource
+
Current resource state
+
Policy context
```

---

# 3. ACTOR TYPES

Project Connect recognizes these actor types.

## 3.1 Anonymous Visitor

Not authenticated.

Code:

`ANONYMOUS`

---

## 3.2 Consumer User

Authenticated end user.

Code:

`USER`

---

## 3.3 Verified Consumer

Consumer with completed selfie/profile verification.

This is a status/attribute, not a separate administrative role.

Code conceptually:

`USER + VERIFIED_PROFILE`

---

## 3.4 Premium Consumer

Consumer with active premium entitlement.

Not an authorization role for safety or administration.

Code conceptually:

`USER + ENTITLEMENTS`

---

## 3.5 Organizer

Approved entity allowed to manage specific events.

Code:

`ORGANIZER`

Organizer privileges may be tied to:

- an individual consumer user;
- an organization record.

---

## 3.6 Moderator

Trust & Safety staff role.

Code:

`MODERATOR`

---

## 3.7 Event Manager

Operational role for events and organizers.

Code:

`EVENT_MANAGER`

---

## 3.8 Super Admin

Highest operational role.

Code:

`SUPER_ADMIN`

---

## 3.9 Support Agent

Recommended distinct role even if initial staffing is small.

Code:

`SUPPORT_AGENT`

Allows customer-service functions without broad moderation/admin access.

---

## 3.10 System Service

Non-human trusted backend actor.

Examples:

- notification worker;
- subscription webhook processor;
- moderation classifier;
- deletion worker;
- event reminder scheduler.

Code:

`SYSTEM_SERVICE`

Services must authenticate independently and have scoped permissions.

---

# 4. USER ATTRIBUTES USED IN AUTHORIZATION

Authorization may evaluate:

- account status;
- phone verification;
- profile completeness;
- dating opt-in;
- discovery setting;
- subscription entitlement;
- organizer approval;
- admin role;
- active block relationships;
- connection state;
- event RSVP state;
- ownership;
- report assignment;
- moderation restrictions;
- feature flags;
- market eligibility.

---

# 5. AUTHORIZATION DECISION MODEL

Every sensitive operation should conceptually answer:

```text
authorize(
    actor,
    action,
    resource,
    context
)
```

Result:

```text
ALLOW
or
DENY(reason_code)
```

Example:

```text
authorize(
    actor = UserA,
    action = SEND_MESSAGE,
    resource = Conversation123
)
```

System evaluates:

1. UserA authenticated?
2. UserA ACTIVE?
3. UserA participant in Conversation123?
4. Connection still active?
5. No block relationship?
6. UserA not message-restricted?
7. Conversation writable?

Only then:

`ALLOW`

---

# 6. AUTHORIZATION ERROR PHILOSOPHY

Do not reveal excessive detail.

Examples:

Instead of:

> "User B blocked you."

Return domain-safe:

`TARGET_NOT_AVAILABLE`

Instead of:

> "You are not participant 7 in conversation 433."

Return:

`CONVERSATION_NOT_AUTHORIZED`

This avoids information leakage.

---

# PART I — ANONYMOUS ACCESS

# 7. ANONYMOUS PERMISSIONS

Anonymous users may access:

- welcome;
- terms;
- privacy;
- community guidelines;
- public support/legal content;
- app-version metadata;
- signup;
- login;
- OTP request/verification.

Anonymous users may not access:

- profiles;
- discovery;
- events requiring app membership;
- conversations;
- users;
- organizer tools;
- admin tools.

---

# 8. ANONYMOUS MATRIX

| Capability | Anonymous |
|---|---:|
| View welcome | Allow |
| View legal policies | Allow |
| Request OTP | Allow with rate limits |
| Verify OTP | Allow |
| View profiles | Deny |
| View event attendees | Deny |
| Message users | Deny |
| Submit report | Deny unless special public safety channel exists |
| Access admin | Deny |

---

# PART II — CONSUMER AUTHORIZATION

# 9. OWN PROFILE

A consumer may:

- read own full user profile;
- update editable profile fields;
- manage own photos;
- manage intents;
- manage interests;
- manage languages;
- manage privacy;
- manage notifications;
- manage dating preferences;
- request deactivation;
- request deletion.

A consumer may not directly modify:

- verification result;
- account status;
- moderation status;
- subscription entitlement;
- report history;
- audit logs.

---

# 10. PROFILE FIELD PERMISSION MATRIX

| Field | Self | Other Consumer | Moderator | Support | Event Manager | Super Admin |
|---|---:|---:|---:|---:|---:|---:|
| First Name | R/W | R if visible | R | R | R limited | R |
| Last Name | R/W | Deny | Restricted | Restricted | Deny | Restricted |
| DOB | R limited | Deny | Restricted | Restricted | Deny | Restricted |
| Age | R | R where applicable | R | R | R limited | R |
| Phone | R | Deny | Restricted | R where support need | Deny | Restricted |
| Email | R | Deny | Restricted | R where support need | Deny | Restricted |
| Bio | R/W | R | R | R | R | R |
| Profession | R/W | R if privacy allows | R | R | R limited | R |
| City | R/W | R | R | R | R | R |
| Exact coordinates | No direct raw UI access | Deny | Normally deny | Deny | Deny | Restricted emergency/admin need |
| Interests | R/W | R | R | R | R | R |
| Languages | R/W | R if allowed | R | R | R | R |
| Dating preferences | R/W | Deny | Safety need only | Deny | Deny | Restricted |
| Verification result | R | Badge only | R | R limited | Deny | R |
| Moderation history | Deny | Deny | R | Limited | Deny | R |
| Audit history | Deny | Deny | Restricted | Deny | Deny | R |

R = read  
W = write

---

# 11. VIEWING ANOTHER PROFILE

Consumer may view target profile only if:

- actor ACTIVE;
- target ACTIVE;
- profile is eligible for requested context;
- no block exists either direction;
- target not hidden due to safety policy;
- applicable discovery/relationship condition permits view.

Profile response must be projected according to privacy rules.

---

# 12. PROFILE ACCESS CONTEXTS

Valid contexts:

```text
DISCOVERY
CONNECTION_REQUEST
CONNECTED
EVENT_ATTENDEE
REPORT_CONTEXT
ADMIN_CONTEXT
SELF
```

The same target profile may return different fields depending on context.

---

# 13. DISCOVERY PERMISSION

Consumer may access discovery if:

- authenticated;
- ACTIVE;
- onboarding complete;
- profile eligible;
- not administratively restricted.

Premium is not required for basic discovery.

---

# 14. DISCOVERY PROFILE VISIBILITY

A consumer may see another user in discovery only if all eligibility rules from Business Rules Catalog pass.

Authorization occurs before ranking.

---

# 15. CONNECTION REQUEST CREATE

Consumer may create request only when:

- actor ACTIVE;
- target ACTIVE;
- no block;
- valid intent compatibility;
- request limit available;
- no existing active connection;
- no duplicate request;
- no moderation restriction.

---

# 16. CONNECTION REQUEST READ

## Sender

May read own outgoing request.

## Recipient

May read request addressed to them.

## Other Consumer

May not read.

## Moderator

May read only if relevant to report/safety investigation.

---

# 17. CONNECTION REQUEST UPDATE

Sender may:

- cancel PENDING request.

Recipient may:

- accept;
- decline.

Neither may arbitrarily change:

- reason;
- sender;
- recipient;
- timestamps;
- status to arbitrary values.

---

# 18. CONNECTION RESOURCE

Only the two participants may access a consumer-facing connection record.

Moderators may access limited connection metadata for safety investigations.

---

# 19. CONVERSATION READ

User may read conversation only when user exists in `conversation_participants`.

Additional rules:

- blocked state may limit visibility;
- closed conversation may remain readable depending product policy;
- user may not add themselves to conversation.

---

# 20. MESSAGE CREATE

Allowed only when:

- actor participant;
- connection active;
- conversation ACTIVE;
- no block;
- actor not restricted;
- content valid.

---

# 21. MESSAGE READ

Only authorized participants.

Moderator exception:

only messages/evidence tied to report or approved safety workflow.

No general "browse user chats" permission.

---

# 22. MESSAGE DELETE

V1 recommendation:

Do not expose arbitrary hard deletion of sent messages unless product formally approves it.

If "delete for me" is later supported:

it affects presentation, not necessarily underlying safety retention.

---

# 23. BLOCK CREATE

Any ACTIVE consumer may block another valid user.

No subscription required.

The blocked user does not consent and is not notified.

---

# 24. BLOCK DELETE / UNBLOCK

Only blocker may remove their own block.

Admin should not silently remove blocks between consumers.

Super Admin intervention only for extraordinary data-repair circumstances with audit.

---

# 25. REPORT CREATE

Authenticated consumer may report:

- another profile;
- conversation;
- message;
- eligible event.

The actor need not remain connected after report submission.

---

# 26. REPORT READ — REPORTER

Reporter may see:

- report successfully submitted;
- possibly high-level status if future product supports.

Reporter does not automatically gain access to:

- moderator notes;
- internal severity;
- enforcement action;
- other reports.

---

# 27. REPORT READ — REPORTED USER

Reported user may not view:

- reporter identity;
- report text;
- evidence;
- internal review.

---

# PART III — EVENT AUTHORIZATION

# 28. EVENT VIEW

ACTIVE consumers may view PUBLISHED eligible events.

Anonymous event browsing is a separate product decision; default V1 recommendation is authenticated-only.

---

# 29. EVENT RSVP

Consumer may RSVP if:

- ACTIVE;
- event PUBLISHED;
- eligibility passes;
- capacity available or waitlist enabled;
- not already RSVP'd.

---

# 30. EVENT RSVP UPDATE

User may cancel own RSVP.

User may not:

- RSVP another user;
- manually set waitlist position;
- mark themselves organizer;
- override capacity.

---

# 31. EVENT ATTENDEE LIST

Consumer may access attendee list only if:

- feature flag on;
- event attendee visibility enabled;
- viewer meets required RSVP/eligibility condition;
- each attendee has opted into visibility;
- block relationships are applied.

---

# 32. EVENT OWNER AUTHORIZATION

An organizer may manage an event only if:

- organizer APPROVED;
- event.organizer_id belongs to that organizer.

Organizer may not manage events owned by another organizer.

---

# 33. ORGANIZER PERMISSIONS

Approved organizer may:

- create event drafts;
- edit own drafts;
- submit/publish own events if direct publishing is enabled;
- view own event RSVP counts;
- view attendee details only as allowed for event operations;
- cancel own event if policy permits.

Organizer may not:

- ban users platform-wide;
- view unrelated private profiles;
- read user chats;
- view safety reports;
- access subscription data.

---

# 34. ORGANIZER SENSITIVE ACCESS

Organizer attendee access should be minimized.

Possible operational attendee fields:

- display name;
- RSVP status;
- check-in identifier if later implemented.

Do not expose:

- phone;
- email;
- exact address;
- dating preferences;
- moderation status.

unless explicit operational/legal basis exists.

---

# PART IV — SUBSCRIPTION AUTHORIZATION

# 35. ENTITLEMENT MODEL

Premium does not create a new security role.

Entitlement checks augment eligible consumer capabilities.

Example:

```text
USER
+
ADVANCED_FILTERS entitlement
```

---

# 36. PREMIUM CAPABILITIES

Premium may allow:

- advanced filters;
- higher ordinary request limit;
- verified-only discovery;
- premium discovery options;
- future profile insights.

Premium may not allow:

- bypassing block;
- messaging strangers;
- bypassing dating consent;
- bypassing moderation;
- access to private data;
- admin functionality.

---

# 37. SUBSCRIPTION READ

Consumer may read own subscription state.

Consumer may not read another user's billing/subscription state unless product explicitly displays a generic badge, which V1 does not require.

---

# 38. SUBSCRIPTION WRITE

Consumer cannot directly set entitlement.

Only trusted billing service may update subscription state.

---

# 39. BILLING PROVIDER WEBHOOK

System service only.

Must validate provider signature/authentication.

Must not trust user-supplied webhook-like payload.

---

# PART V — SUPPORT AGENT AUTHORIZATION

# 40. SUPPORT_AGENT ROLE

Recommended V1 permissions:

May:

- search user by support-safe identifiers;
- view account status;
- view basic profile;
- view app version/device diagnostics;
- view subscription status high-level;
- review support tickets;
- trigger allowed account recovery procedures;
- escalate to moderation/billing/admin.

May not:

- read private chats;
- read moderation evidence;
- ban users;
- change feature flags;
- alter premium entitlement manually unless separate billing privilege exists;
- access precise location.

---

# 41. SUPPORT DATA MINIMIZATION

Support should see only what's necessary for customer issue resolution.

Example:

For "I cannot log in":

support does not need:

- interests;
- dating preferences;
- private conversations.

---

# PART VI — MODERATOR AUTHORIZATION

# 42. MODERATOR PURPOSE

Moderator exists for Trust & Safety.

Primary capabilities:

- review reports;
- review reported profile;
- review scoped evidence;
- view relevant prior safety history;
- warn;
- limit;
- suspend within policy;
- escalate;
- document decisions.

---

# 43. MODERATOR MAY VIEW

- reported user profile;
- relevant account status;
- verification status;
- report details;
- prior report summaries;
- moderation actions;
- evidence attached to report;
- relevant conversation excerpts associated with report.

---

# 44. MODERATOR MAY NOT VIEW BY DEFAULT

- unrelated private conversations;
- full billing details;
- full exact location history;
- subscription-provider payloads;
- feature flags;
- admin role assignment;
- raw authentication tokens;
- selfie biometric files unless special escalation permits.

---

# 45. MODERATOR ENFORCEMENT

Allowed actions should be policy constrained.

Typical:

- warn;
- limited account;
- under review;
- temporary suspend;
- escalate for ban.

Whether Moderator may issue permanent ban directly is a policy decision.

Recommended:

high-confidence categories may permit; otherwise Super Admin approval.

---

# 46. MODERATOR ACTION REQUIREMENTS

Every action requires:

- target;
- reason code;
- associated report or independent safety reason;
- internal note for material enforcement;
- audit event.

---

# 47. MODERATOR REPORT ASSIGNMENT

Moderator may:

- claim unassigned report;
- work assigned reports;
- release/escalate according to workflow.

A moderator may not arbitrarily alter another moderator's closed adjudication without elevated workflow.

---

# PART VII — EVENT MANAGER AUTHORIZATION

# 48. EVENT_MANAGER ROLE

May:

- create/edit platform events;
- review organizer applications;
- approve/revoke organizers within policy;
- edit/cancel events;
- manage event categories;
- view event operational metrics.

May not:

- view private conversations;
- review general user reports;
- ban users globally;
- manage subscriptions;
- change security configuration.

---

# 49. EVENT_MANAGER USER ACCESS

May view user information only where needed for event operations.

Examples:

- RSVP identity;
- event eligibility;
- check-in status future.

No broad user search for personal browsing.

---

# PART VIII — SUPER ADMIN AUTHORIZATION

# 50. SUPER_ADMIN ROLE

Super Admin may:

- manage admin roles;
- manage consumer account states;
- review reports;
- perform moderation overrides;
- manage organizers;
- manage events;
- manage feature flags;
- manage configuration;
- view audit logs;
- initiate controlled operational overrides.

---

# 51. SUPER ADMIN IS NOT UNLIMITED BY DEFAULT

Even Super Admin should not have routine access to:

- raw passwords;
- plaintext OTPs;
- raw tokens;
- full biometric data;
- production secrets.

No role should expose what system should not store.

---

# 52. HIGH-RISK SUPER ADMIN ACTIONS

Require:

- reauthentication/MFA;
- explicit reason;
- audit log;
- possibly second-person approval later.

Examples:

- permanent ban reversal;
- account-status override;
- entitlement manual override;
- admin-role assignment;
- feature kill-switch changes;
- viewing highly sensitive evidence.

---

# PART IX — SYSTEM SERVICE AUTHORIZATION

# 53. SERVICE IDENTITIES

Each backend service/worker should receive scoped identity.

Avoid one universal service account.

Examples:

```text
notification-service
billing-webhook-service
deletion-worker
moderation-service
analytics-publisher
event-reminder-worker
```

---

# 54. NOTIFICATION SERVICE

May:

- read notification job;
- read minimal destination token;
- deliver notification;
- update delivery status.

May not:

- browse profiles broadly;
- access private chats beyond message metadata required for notification;
- modify user status.

---

# 55. BILLING SERVICE

May:

- validate purchases;
- read/write subscriptions;
- calculate entitlements;
- emit billing events.

May not:

- modify safety state;
- view chat content.

---

# 56. DELETION WORKER

May access required domains for deletion orchestration.

Privileges should be narrowly scoped to:

- deletion/anonymization actions;
- not arbitrary reads.

All deletion operations should be auditable.

---

# 57. ANALYTICS SERVICE

Receives approved analytics events.

Should not have direct unrestricted transactional DB access if avoidable.

No need for:

- raw phone;
- email;
- exact location;
- private message content.

---

# PART X — ROLE CAPABILITY MATRIX

Legend:

- A = Allowed
- C = Conditional
- D = Denied

| Capability | User | Organizer | Support | Moderator | Event Manager | Super Admin |
|---|---:|---:|---:|---:|---:|---:|
| View own profile | A | A | C | C | C | A |
| Edit own profile | A | A | D | D | D | C |
| View other public profile | C | C | C | C | C | C |
| View private phone/email | Self only | Self only | C | C | D | C |
| View exact location | D | D | D | D | D | C |
| Discover people | C | C | D | D | D | D |
| Send connection request | C | C as consumer | D | D | D | D |
| Send messages | C | C as consumer | D | D | D | D |
| Block user | A | A | D | D | D | C exceptional |
| Report user | A | A | C support escalation | D operationally | D | C |
| View reports | Own receipt only | Own receipt only | Limited | A | D | A |
| View report evidence | D | D | D | C | D | C |
| Suspend user | D | D | D | C | D | A |
| Ban user | D | D | D | C/policy | D | A |
| Create event draft | D | A | D | D | A | A |
| Publish event | D | C | D | D | A | A |
| Cancel own event | D | C | D | D | A | A |
| Manage organizer | D | D | D | D | A | A |
| View RSVP ops data | Own RSVP | Own events only | Limited | Safety context | A | A |
| View subscription self | A | A | C | D | D | A |
| Change entitlement | D | D | D | D | D | A/system only preferably |
| Manage feature flags | D | D | D | D | D | A |
| Manage admin roles | D | D | D | D | D | A |
| View audit logs | D | D | D | Restricted | Restricted | A |

---

# PART XI — RESOURCE OWNERSHIP RULES

# 58. OWNED RESOURCE

A resource is owned when actor's user/admin identifier matches authorized owner reference.

Examples:

```text
user_profile.user_id == actor.user_id
event.organizer_id == actor.organizer_id
support_case.user_id == actor.user_id
```

Ownership is necessary but may not be sufficient.

An organizer owning an event still cannot publish if organizer is suspended.

---

# 59. SHARED RESOURCE

Examples:

- Connection
- Conversation

Authorization comes from membership/participation.

---

# 60. ASSIGNED RESOURCE

Examples:

- report assigned to moderator;
- support ticket assigned to support agent.

Assignment may grant operational access.

---

# PART XII — ATTRIBUTE-BASED ACCESS CONTROL

RBAC alone is insufficient.

Project Connect should implement a hybrid:

> **RBAC + ABAC + resource relationship checks**

Examples of attributes:

- actor.account_status;
- actor.roles;
- actor.entitlements;
- target.account_status;
- event.status;
- relationship.blocked;
- conversation.participant;
- report.assigned_admin;
- organizer.status.

---

# 61. EXAMPLE AUTHORIZATION POLICY — PROFILE

```text
canViewProfile(actor, target, context):
    require actor authenticated
    require actor allowed account state

    if actor.id == target.id:
        allow self projection

    deny if block exists

    if context == DISCOVERY:
        require target discoverable
        require target discovery eligible
        require context compatibility

    if context == CONNECTED:
        require active/relevant connection or permitted historical state

    return privacy-projected profile
```

---

# 62. EXAMPLE POLICY — SEND MESSAGE

```text
canSendMessage(actor, conversation):
    require actor ACTIVE
    require actor participant
    require conversation ACTIVE
    require active connection
    require no block either direction
    require actor not messaging-restricted
    allow
```

---

# 63. EXAMPLE POLICY — VIEW EVENT ATTENDEE

```text
canViewAttendees(actor, event):
    require actor ACTIVE
    require attendee-discovery feature enabled
    require event attendee visibility enabled
    require actor RSVP eligible / RSVP'd if policy requires

for each attendee:
    require attendee opted in
    suppress if block exists
```

---

# 64. EXAMPLE POLICY — MODERATOR EVIDENCE

```text
canViewReportEvidence(admin, report):
    require role MODERATOR or SUPER_ADMIN
    require report assigned OR policy allows queue access
    require evidence relevant to report
    log sensitive access
```

---

# PART XIII — IDOR PREVENTION

# 65. OBJECT-LEVEL AUTHORIZATION

Every endpoint using client-provided resource ID must perform ownership/relationship check.

Examples:

Bad:

```text
GET /conversations/{id}
```

followed only by database lookup.

Correct:

```text
conversation = find(id)
authorize(actor, READ_CONVERSATION, conversation)
```

---

# 66. IDOR TESTS REQUIRED

Must test:

- another user's profile-edit endpoint;
- another user's conversation;
- another user's request;
- another user's RSVP;
- another organizer's event;
- another moderator's report assignment;
- another user's subscription;
- another user's blocked list;
- another user's support case.

---

# PART XIV — ADMIN API ISOLATION

# 67. SEPARATE ADMIN AUTHORIZATION BOUNDARY

Strong recommendation:

Admin APIs under separate namespace:

```text
/admin/*
```

with separate middleware and authentication.

Do not expose staff operations through ordinary consumer endpoints controlled only by hidden UI.

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](SPEC-RECONCILIATION.md) R-06, R-07:** the admin namespace is frozen as `/admin/v1/*`; `/admin/*` paths in this document mean `/admin/v1/*`. Consumer endpoints in Part XXIV are relative to `/api/v1`. MFA is mandatory for every staff role, including `SUPPORT_AGENT`. Restriction flags (Part XVII) are persisted in the structured `user_restrictions` table (R-10).

---

# 68. ADMIN AUTHENTICATION

Require:

- enterprise/managed identity if practical;
- MFA;
- short session lifetime;
- elevated-action reauthentication.

---

# 69. ADMIN SESSION CONTROLS

Recommended:

- idle timeout;
- absolute timeout;
- device/session logging;
- revocation capability.

---

# PART XV — PII ACCESS CONTROL

# 70. PHONE NUMBER

Accessible to:

- self;
- limited Support where needed;
- restricted Moderator/Super Admin only when justified.

Every administrative view should mask by default:

`+1 ••• ••• 1234`

Reveal action may require explicit permission and audit.

---

# 71. DATE OF BIRTH

Users see/edit own DOB only according to age-change policy.

Other consumers receive calculated age only.

Admin view should default to age, not raw DOB, unless necessary.

---

# 72. PRECISE GEOLOCATION

No consumer/admin routine UI should expose raw exact coordinates.

Access only through narrowly-scoped technical/security workflows if absolutely necessary.

---

# 73. DATING DATA

Treat as sensitive.

Only:

- user self;
- eligibility engine;
- limited safety review where necessary.

No casual admin browsing.

---

# PART XVI — ACCOUNT STATUS AUTHORIZATION

# 74. ACTIVE

Normal capabilities.

---

# 75. LIMITED

Capabilities defined by restriction flags.

Possible:

- discovery disabled;
- new requests disabled;
- messaging existing connections allowed.

Avoid one vague LIMITED behavior.

Store specific restrictions where required.

---

# 76. UNDER_REVIEW

Recommended:

- no new discovery;
- no new connection requests;
- existing messaging configurable;
- support access remains.

---

# 77. SUSPENDED

No social interaction.

Allowed:

- login to restricted screen;
- support;
- legal/account management;
- deletion request where policy permits.

---

# 78. BANNED

No normal product access.

Appeal/support path according to policy.

---

# 79. DEACTIVATED

No discovery or interaction.

Sign-in may reactivate after confirmation.

---

# PART XVII — RESTRICTION FLAGS

Recommendation:

Do not rely solely on `account_status`.

Support specific restrictions:

```text
CAN_DISCOVER
CAN_BE_DISCOVERED
CAN_SEND_REQUESTS
CAN_RECEIVE_REQUESTS
CAN_MESSAGE
CAN_RSVP
CAN_USE_DATING
```

A restriction engine can override normal permissions.

Example:

User can remain ACTIVE but temporarily:

`CAN_SEND_REQUESTS=false`

for spam behavior.

---

# PART XVIII — ORGANIZER PERMISSION MATRIX

| Action | Approved Organizer | Suspended Organizer | Event Manager | Super Admin |
|---|---:|---:|---:|---:|
| Create draft | A | D | A | A |
| Edit own draft | A | D | A | A |
| Edit another organizer's event | D | D | A | A |
| Publish own event | C | D | A | A |
| Cancel own event | C | D | A | A |
| View own RSVP list | C | D/C read-only | A | A |
| View unrelated event RSVPs | D | D | A | A |
| Approve organizer | D | D | A | A |
| Revoke organizer | D | D | A | A |

---

# PART XIX — REPORT PERMISSION MATRIX

| Action | Reporter | Reported User | Moderator | Support | Event Manager | Super Admin |
|---|---:|---:|---:|---:|---:|---:|
| Submit | A | A independently | C | C | C | C |
| Read own submission receipt | A | D | A | Limited | D | A |
| Read report text | Own only maybe | D | A | D | D | A |
| Read evidence | D | D | C | D | D | C |
| Assign | D | D | A | D | D | A |
| Resolve | D | D | A | D | D | A |
| Change severity | D | D | C | D | D | A |
| View reporter identity | Self | D | C | D | D | C |

---

# PART XX — FEATURE FLAG AUTHORIZATION

# 80. FEATURE FLAG READ

Consumer clients may receive only evaluated flag values relevant to them.

Do not return internal rollout configuration.

Example:

Client receives:

```text
datingEnabled: true
```

Not:

```text
rolloutPercent: 42
internalExperimentCohort: X
```

unless needed.

---

# 81. FEATURE FLAG WRITE

Only Super Admin or dedicated platform-operator role.

All changes audited.

Critical flags may require confirmation.

---

# PART XXI — CONFIGURATION AUTHORIZATION

# 82. APP_CONFIG READ

Consumers receive only safe public configuration.

Examples:

- connection limit value;
- supported interest labels;
- discovery max radius.

Do not expose:

- risk thresholds;
- abuse heuristics;
- moderation secrets.

---

# 83. APP_CONFIG WRITE

Restricted to Super Admin/platform operations.

No mobile write access.

---

# PART XXII — AUDIT REQUIREMENTS

# 84. AUDITED ACTIONS

Mandatory audit for:

- admin role changes;
- user status changes;
- bans/suspensions;
- organizer approval/revocation;
- feature flag writes;
- manual entitlement overrides;
- report resolutions;
- sensitive PII reveal;
- moderation evidence access where feasible;
- account restoration;
- deletion overrides.

---

# 85. AUDIT RECORD

Include:

- actor;
- action;
- resource;
- timestamp;
- request/correlation ID;
- reason;
- before/after state where applicable.

Audit events are append-only.

---

# PART XXIII — SENSITIVE VIEW AUDITING

# 86. HIGH-SENSITIVITY READS

Recommended audited reads:

- phone reveal by staff;
- raw DOB reveal;
- moderation evidence;
- verification artifact;
- precise location;
- deleted-account retained data.

---

# PART XXIV — API AUTHORIZATION MATRIX

## Consumer User APIs

| Endpoint | Authorization |
|---|---|
| `GET /users/me` | Self |
| `PATCH /users/me/profile` | Self + allowed account state |
| `GET /profiles/{id}` | Contextual profile authorization |
| `GET /discovery` | ACTIVE + discovery eligibility |
| `POST /connections/requests` | Connection policy |
| `POST /connections/requests/{id}/accept` | Recipient only |
| `POST /connections/requests/{id}/decline` | Recipient only |
| `POST /connections/requests/{id}/cancel` | Sender only |
| `GET /conversations/{id}` | Participant only |
| `POST /conversations/{id}/messages` | Authorized active participant |
| `POST /users/{id}/block` | ACTIVE user, valid target |
| `DELETE /users/{id}/block` | Original blocker |
| `POST /reports` | Authenticated eligible user |
| `POST /events/{id}/rsvp` | Event eligibility |
| `DELETE /events/{id}/rsvp` | Own RSVP |
| `GET /events/{id}/attendees` | Attendee policy |
| `GET /subscriptions/me` | Self only |

---

# 87. ADMIN API MATRIX

| Endpoint | Moderator | Support | Event Manager | Super Admin |
|---|---:|---:|---:|---:|
| `/admin/reports` | A | D | D | A |
| `/admin/reports/{id}` | A | D | D | A |
| `/admin/users/{id}` | C | C | C limited | A |
| `/admin/users/{id}/suspend` | C | D | D | A |
| `/admin/users/{id}/ban` | C/policy | D | D | A |
| `/admin/events` | D | D | A | A |
| `/admin/organizers` | D | D | A | A |
| `/admin/feature-flags` | D | D | D | A |
| `/admin/config` | D | D | D | A |
| `/admin/audit` | Restricted | D | Restricted | A |
| `/admin/subscriptions` | D | C support status | D | A restricted |

---

# PART XXV — FUNCTION-LEVEL AUTHORIZATION CONTRACTS

# 88. `canViewProfile`

Inputs:

```text
actorUserId
targetUserId
context
```

Checks:

- authenticated;
- actor state;
- target state;
- block;
- contextual eligibility;
- privacy projection.

Returns:

- allowed;
- projection policy;
- denial reason.

---

# 89. `canSendConnectionRequest`

Checks:

- sender/recipient state;
- block;
- intent;
- dating policy;
- connection state;
- request state;
- safety limits;
- product limits.

---

# 90. `canMessage`

Checks:

- actor participation;
- active relationship;
- block;
- restrictions;
- conversation state.

---

# 91. `canViewEvent`

Checks:

- event publication/status;
- account eligibility;
- event eligibility.

---

# 92. `canManageEvent`

Checks:

- role;
- organizer ownership;
- organizer status;
- event state.

---

# 93. `canViewReport`

Checks:

- staff role;
- assignment/queue authorization;
- report scope.

---

# PART XXVI — UI PERMISSION GUIDANCE

UI should reflect backend authorization.

Examples:

If `canSendRequest=false` because already connected:

show:

**Message**

not disabled **Connect**.

If user suspended:

hide normal app navigation and show restricted account experience.

If premium-only filter:

show locked state/paywall trigger rather than sending unauthorized API.

But backend remains authority.

---

# PART XXVII — PERMISSION CACHING

Some authorization data may be cached:

- entitlements;
- feature flags;
- roles.

High-risk authorization must either:

- use short TTL;
- support immediate invalidation.

Examples requiring fast invalidation:

- block;
- suspension;
- ban;
- admin-role revocation.

---

# PART XXVIII — SECURITY AGAINST STALE AUTHORIZATION

Scenario:

User opens conversation.

Then other user blocks them.

The first user's client still shows composer.

Backend must reject next send.

Therefore:

> Never depend on UI state being current.

---

# PART XXIX — PRIVILEGE ESCALATION TESTS

Mandatory tests:

1. consumer calls admin endpoint;
2. organizer edits someone else's event;
3. event manager attempts user ban;
4. moderator changes feature flag;
5. support agent reads chat;
6. premium user attempts admin feature;
7. user modifies another user's profile;
8. user accesses another conversation;
9. user changes request sender/recipient;
10. user manually grants entitlement.

All must fail.

---

# PART XXX — MASS-ASSIGNMENT PROTECTION

Do not bind request bodies directly into ORM objects.

Example risk:

Consumer sends:

```json
{
  "firstName": "John",
  "accountStatus": "ACTIVE",
  "isAdmin": true
}
```

Profile endpoint must whitelist only editable fields.

Never allow hidden attributes through generic update.

---

# PART XXXI — FIELD-LEVEL WRITE AUTHORIZATION

Example `PATCH /users/me/profile` may write:

- first_name;
- bio;
- profession;
- hometown.

Must reject/ignore:

- account_status;
- phone_verified_at;
- subscription_status;
- verification_status;
- moderation_state;
- admin_role.

Prefer rejection for unexpected protected fields rather than silent acceptance.

---

# PART XXXII — ROLE ASSIGNMENT

Only Super Admin may grant staff roles in V1.

Role assignment requires:

- valid target staff identity;
- reason;
- MFA;
- audit.

Consumer account cannot self-promote into staff.

---

# PART XXXIII — ORGANIZER ASSIGNMENT

Event Manager or Super Admin may approve organizer.

Approval must not grant unrelated staff role.

Organizer remains a constrained operational principal.

---

# PART XXXIV — SUPPORT IMPERSONATION

V1 recommendation:

Do **not** build "login as user."

If future support impersonation is required:

- separate audited feature;
- explicit user/session banner;
- no payment/security actions;
- strong controls.

Avoid entirely in V1.

---

# PART XXXV — BREAK-GLASS ACCESS

Highly privileged emergency access may be required operationally.

Requirements:

- limited named staff;
- MFA;
- justification;
- short-lived access;
- full audit;
- post-use review.

Not a normal workflow.

---

# PART XXXVI — AUTHORIZATION LOGGING

Log denials with:

- correlation ID;
- actor pseudonymous ID;
- action code;
- resource type;
- denial reason;
- timestamp.

Do not log sensitive payloads.

Useful for:

- intrusion detection;
- debugging;
- abuse detection.

---

# PART XXXVII — AUTHORIZATION REASON CODES

Canonical examples:

```text
AUTH_REQUIRED
ACCOUNT_NOT_ACTIVE
INSUFFICIENT_ROLE
RESOURCE_NOT_OWNED
RESOURCE_NOT_ASSIGNED
RESOURCE_NOT_AVAILABLE
BLOCK_RELATIONSHIP_EXISTS
NOT_CONVERSATION_PARTICIPANT
CONNECTION_NOT_ACTIVE
DATING_NOT_ELIGIBLE
EVENT_NOT_ELIGIBLE
ENTITLEMENT_REQUIRED
ORGANIZER_NOT_APPROVED
MODERATION_RESTRICTED
```

Do not expose all internal reason detail to client.

Map to client-safe codes where necessary.

---

# PART XXXVIII — AUTHORIZATION SERVICE ARCHITECTURE

Recommended central policy layer:

```text
AuthorizationService
├── ProfilePolicy
├── DiscoveryPolicy
├── ConnectionPolicy
├── MessagingPolicy
├── EventPolicy
├── SafetyPolicy
├── BillingPolicy
└── AdminPolicy
```

Controllers should ask policy services.

Do not duplicate condition logic across route handlers.

---

# PART XXXIX — POLICY EVALUATION ORDER

For consumer action:

```text
1. Authentication
2. Account Status
3. Safety Restriction
4. Block Check
5. Resource Relationship
6. Context Eligibility
7. Entitlement
8. Feature Flag
9. Action-Specific Rules
```

Safety precedes commercial rules.

---

# PART XL — ENDPOINT DESIGN GUIDELINE

Prefer resource semantics.

Good:

```text
POST /connections/requests/{id}/accept
```

Backend derives actor from session.

Avoid:

```text
POST /accept-request
{
  "userId": "...",
  "actingAsUser": "..."
}
```

Never let consumer supply actor identity if session already defines it.

---

# PART XLI — DATA PROJECTION BY ROLE

Never return one giant user object and trust frontend to hide fields.

Create DTOs:

```text
SelfUserDto
PublicProfileDto
ConnectedProfileDto
ModeratorUserDto
SupportUserDto
AdminUserDto
```

Each explicit.

---

# PART XLII — AUTHORIZATION & DATABASE QUERIES

Where practical, authorization should be reflected in query constraints.

Example conversation lookup:

```text
SELECT conversation
WHERE id = :conversationId
AND EXISTS participant actor
```

This reduces accidental IDOR.

Still retain policy evaluation for business rules.

---

# PART XLIII — TEST MATRIX

Every protected capability needs:

## Positive test
Authorized actor succeeds.

## Negative role test
Wrong role denied.

## Ownership test
Same role, wrong owner denied.

## State test
Correct actor, invalid resource state denied.

## Safety test
Block/restriction overrides.

## Entitlement test
Premium gating works.

## Stale-client test
Server denies after state changes.

---

# PART XLIV — HIGH-RISK AUTHORIZATION TEST CASES

## HR-01

User A blocks User B.

User B retains old profile ID.

User B calls:

`GET /profiles/A`

Expected:
denied or privacy-safe unavailable response.

---

## HR-02

User A disconnects User B.

User B calls message endpoint using old conversation.

Expected:
send denied.

---

## HR-03

Premium expires while app still has cached premium flag.

User calls premium filter endpoint.

Expected:
backend entitlement denies.

---

## HR-04

Moderator role revoked mid-session.

Next admin action:

denied after role cache invalidation.

---

## HR-05

Organizer suspended after opening edit screen.

Save request:

denied.

---

# PART XLV — V1 PERMISSION DEFINITIONS

Canonical permission codes recommended:

```text
profile:self:read
profile:self:write
profile:public:read

discovery:read

connection:request:create
connection:request:read
connection:request:accept
connection:request:decline
connection:request:cancel

conversation:read
message:create

block:create
block:delete
report:create

event:read
event:rsvp
event:manage:own
event:manage:any

organizer:approve
organizer:revoke

report:read
report:assign
report:resolve

user:moderate
user:suspend
user:ban

subscription:self:read
subscription:admin:read
entitlement:override

feature_flag:read_admin
feature_flag:write

audit:read

admin_role:manage
```

Roles map to these permissions.

Business policies then apply additional context.

---

# PART XLVI — ROLE TO PERMISSION BASELINE

## USER

```text
profile:self:read
profile:self:write
profile:public:read
discovery:read
connection:request:create
connection:request:read
connection:request:accept
connection:request:decline
connection:request:cancel
conversation:read
message:create
block:create
block:delete
report:create
event:read
event:rsvp
subscription:self:read
```

---

## ORGANIZER

Inherits ordinary USER capabilities if organizer is linked to consumer account, plus:

```text
event:manage:own
```

---

## SUPPORT_AGENT

```text
support:case:read
support:case:update
user:support_view
subscription:support_view
```

No chat/safety evidence.

---

## MODERATOR

```text
report:read
report:assign
report:resolve
user:moderate
user:suspend
moderation:evidence:read_scoped
```

---

## EVENT_MANAGER

```text
event:manage:any
organizer:approve
organizer:revoke
event:operations:read
```

---

## SUPER_ADMIN

All administrative permissions, but still subject to:

- sensitive-access controls;
- MFA;
- audit;
- system-secret exclusion.

---

# PART XLVII — AUTHORIZATION GOVERNANCE

Any new feature must answer before implementation:

1. Who can invoke it?
2. On whose data?
3. Under what account states?
4. Does ownership matter?
5. Does block affect it?
6. Does privacy affect it?
7. Does dating consent affect it?
8. Does entitlement affect it?
9. Does role affect it?
10. Is audit required?
11. What must be denied?
12. What error is returned?
13. What field-level projection is returned?

No new feature is complete without authorization design.

---

# PART XLVIII — CLAUDE CODE AUTHORIZATION RULES

Claude Code must never:

- implement admin access through frontend-only hiding;
- trust `userId` supplied by client as actor identity;
- expose raw ORM entities;
- skip resource ownership checks;
- bypass block logic;
- use premium status as a safety override;
- add broad `isAdmin` shortcuts;
- grant wildcard permissions casually;
- use one staff role for all administration;
- remove authorization checks to fix a failing test;
- expose private data because "the endpoint is authenticated."

Any authorization-affecting code change must reference:

- permission code;
- policy function;
- affected business rule;
- test coverage.

---

# PART XLIX — SECURITY REVIEW CHECKLIST

Before launch, security review must verify:

- all protected APIs authenticated;
- object-level authorization;
- field-level projection;
- no mass assignment;
- admin endpoint isolation;
- RBAC + ABAC implementation;
- entitlement verification;
- block precedence;
- role revocation behavior;
- session invalidation;
- staff MFA;
- PII access controls;
- sensitive access auditing;
- privilege escalation tests;
- IDOR penetration tests.

---

# PART L — DEFINITION OF AUTHORIZATION COMPLETE

A capability is not authorization-complete until:

1. Permission defined.
2. Role mapping defined.
3. Resource relationship defined.
4. Policy conditions defined.
5. Denial conditions defined.
6. Backend enforcement implemented.
7. UI reflects authorization.
8. PII projection defined.
9. Audit behavior defined.
10. Positive and negative tests pass.

---

# PART LI — FINAL AUTHORIZATION POSITION

Project Connect V1 uses a hybrid:

> **RBAC + Attribute-Based Policy + Resource Ownership + Relationship Authorization**

The fundamental principles are:

> **Authentication never implies broad data access.**

> **Consumers may act primarily on their own resources and mutually-authorized relationships.**

> **Blocks override connection, discovery, messaging and premium capabilities.**

> **Premium entitlements improve product capability but never grant social consent.**

> **Staff permissions are separated by operational function.**

> **Moderators see only safety-relevant evidence.**

> **Event managers do not become trust-and-safety administrators.**

> **Support agents do not receive unrestricted private-data access.**

> **Super Admin actions remain auditable and high-risk reads remain controlled.**

> **The backend makes every final authorization decision.**

---

# NEXT ARTIFACT

The next artifact should be:

## **V1 Trust & Safety Operating Specification**

It should define in operational detail:

- moderation workflow;
- report triage;
- severity scoring;
- response SLAs;
- evidence handling;
- warning/suspension/ban criteria;
- harassment policy;
- sexual-content policy;
- scam/fraud policy;
- underage detection;
- stalking/threat response;
- event safety;
- account appeals;
- repeat-offender handling;
- automated moderation;
- human-review boundaries;
- moderator QA;
- safety metrics;
- crisis escalation;
- retention of safety evidence.

That is the correct next document before notification/analytics and before final technical architecture because this product's core value proposition depends directly on trust.