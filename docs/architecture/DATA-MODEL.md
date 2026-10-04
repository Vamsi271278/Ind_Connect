# V1 DETAILED DATA MODEL + DATA DICTIONARY

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

---

# 1. PURPOSE

This document defines the canonical V1 application data model.

It establishes:

- domain entities;
- table boundaries;
- primary and foreign keys;
- field definitions;
- enum values;
- privacy classifications;
- indexes;
- constraints;
- retention rules;
- auditability;
- ownership;
- soft-delete behavior;
- archival rules;
- relationships;
- data access expectations.

This document is intended for:

- backend engineering;
- database engineering;
- system architecture;
- mobile engineering;
- analytics;
- QA;
- security;
- trust & safety;
- admin-console engineering;
- Claude Code.

---

# 2. DATA ARCHITECTURE PRINCIPLES

## 2.1 Relational Core

The transactional system of record should use a relational database.

Recommended:

**PostgreSQL**

Reason:

Project Connect contains strongly relational entities:

- users;
- profiles;
- interests;
- intents;
- connections;
- conversations;
- messages;
- events;
- RSVPs;
- subscriptions;
- reports;
- moderation actions.

Referential integrity is valuable.

---

# 2.2 UUID Primary Keys

Use UUID primary keys for externally referenceable transactional entities.

Recommended:

UUIDv7 where supported.

Benefits:

- globally unique;
- time-order friendly;
- avoids predictable sequential IDs;
- easier distributed generation.

Do not expose internal numeric database sequences to clients.

---

# 2.3 UTC Storage

All timestamps stored in UTC.

Example type:

`TIMESTAMPTZ`

Presentation layer converts to user timezone.

---

# 2.4 Immutable Creation Time

Every primary entity should contain:

`created_at`

Never mutate it.

---

# 2.5 Updated Time

Mutable entities contain:

`updated_at`

Update automatically on meaningful changes.

---

# 2.6 Soft Delete Is Not Universal

Do not automatically add `deleted_at` to every table.

Use lifecycle semantics appropriate to each domain.

Examples:

User:
formal deletion workflow.

Interest taxonomy:
deactivation rather than deletion.

Connection request:
state transition.

Report:
retain according to safety policy.

---

# 2.7 Data Classification

Every field receives one privacy classification.

## PUBLIC

Safe to expose on authorized public profile.

Examples:
- display name;
- interests;
- approved profile photo.

## USER-CONTROLLED

May be public depending on privacy settings.

Examples:
- profession;
- distance;
- event attendance.

## PRIVATE

Never public.

Examples:
- phone;
- email;
- DOB.

## SENSITIVE

Requires heightened protection.

Examples:
- precise geolocation;
- dating preferences;
- moderation reports.

## HIGHLY SENSITIVE

Access must be tightly restricted.

Examples:
- selfie verification artifacts;
- moderation evidence;
- authentication token hashes.

---

# 3. DOMAIN BOUNDARIES

V1 data is divided into the following domains:

```text id="5c4rtb"
Identity & Authentication
Profile
Location
Intent
Interests
Verification
Discovery
Connections
Messaging
Safety
Events
Notifications
Subscriptions
Admin & Moderation
Configuration
Analytics
Audit
```

Each domain should have clear ownership.

---

# 4. ENTITY MAP

```text id="3hpdak"
USER
 │
 ├── USER_PROFILE
 │    ├── USER_PHOTO
 │    ├── USER_LANGUAGE
 │    ├── USER_INTEREST
 │    ├── USER_INTENT
 │    └── USER_PRIVACY_SETTING
 │
 ├── USER_LOCATION
 │
 ├── USER_VERIFICATION
 │
 ├── CONNECTION_REQUEST
 │       ↓
 │    CONNECTION
 │       ↓
 │    CONVERSATION
 │       ↓
 │    MESSAGE
 │
 ├── USER_BLOCK
 │
 ├── REPORT
 │
 ├── EVENT_RSVP
 │
 ├── NOTIFICATION
 │
 └── SUBSCRIPTION
```

Administrative structures:

```text id="mx4z3j"
ADMIN_USER
 │
 ├── ADMIN_ROLE
 ├── MODERATION_ACTION
 ├── REPORT_ASSIGNMENT
 ├── ORGANIZER_APPROVAL
 └── AUDIT_EVENT
```

---

# 5. USER

## Table

`users`

## Purpose

Canonical identity record.

One row represents one consumer account.

## Fields

### id
Type:
UUID

Primary key.

Classification:
PRIVATE

---

### phone_e164
Type:
VARCHAR(20)

Example:

`+12145551234`

Required:
Yes after verification.

Unique:
Yes for active accounts.

Classification:
PRIVATE.

Encrypted at rest where architecture supports field-level encryption.

---

### phone_verified_at
Type:
TIMESTAMPTZ nullable.

Classification:
PRIVATE.

---

### email
Type:
VARCHAR(320) nullable.

Optional V1.

Unique where non-null depending on login strategy.

Classification:
PRIVATE.

---

### email_verified_at
TIMESTAMPTZ nullable.

---

### date_of_birth
Type:
DATE.

Required:
Yes.

Classification:
PRIVATE/SENSITIVE.

Never return through public profile endpoint.

Age should be calculated server-side.

---

### account_status
Enum:

```text id="3jrjpk"
ACTIVE
PENDING_VERIFICATION
LIMITED
UNDER_REVIEW
SUSPENDED
BANNED
DEACTIVATED
DELETION_PENDING
DELETED
```

Required:
Yes.

Default during signup:

`PENDING_VERIFICATION`

Indexed.

---

### onboarding_status
Enum:

```text id="gysvut"
NOT_STARTED
IN_PROGRESS
COMPLETE
```

---

### onboarding_step
VARCHAR/enum.

Example:

```text id="qixm41"
AGE
PHONE
NAME
GENDER
LOCATION
INTENT
LANGUAGE
INTERESTS
PHOTO
ABOUT
VERIFICATION
NOTIFICATIONS
COMPLETE
```

Used to resume onboarding.

---

### discoverable
BOOLEAN.

Default:
false until onboarding completion.

---

### last_active_at
TIMESTAMPTZ.

Used cautiously for ranking.

---

### deactivated_at
TIMESTAMPTZ nullable.

---

### deletion_requested_at
TIMESTAMPTZ nullable.

---

### deletion_completed_at
TIMESTAMPTZ nullable.

---

### created_at
TIMESTAMPTZ.

---

### updated_at
TIMESTAMPTZ.

---

## Constraints

- DOB must indicate age >=18 at account activation.
- phone required before ACTIVE.
- DELETED accounts cannot become ACTIVE without defined recovery flow.
- discoverable=false automatically for suspended/banned/deactivated/deleted.

---

## Indexes

- unique active phone;
- account_status;
- discoverable;
- last_active_at;
- created_at.

---

# 6. AUTH_IDENTITIES

## Table

`auth_identities`

## Purpose

Links user to authentication providers.

Supports future:

- phone;
- Apple;
- Google.

## Fields

### id
UUID PK.

### user_id
UUID FK → users.id.

### provider
Enum:

```text id="6vr9ca"
PHONE
APPLE
GOOGLE
```

### provider_subject
VARCHAR.

Unique by provider.

### created_at

### last_used_at

---

## Constraint

Unique:

`(provider, provider_subject)`

---

# 7. OTP_CHALLENGES

## Table

`otp_challenges`

## Purpose

Temporary authentication challenge data.

## Fields

- id UUID;
- phone_hash;
- purpose;
- code_hash;
- expires_at;
- attempt_count;
- max_attempts;
- consumed_at;
- resend_count;
- created_at;
- metadata/risk_context optional.

## Classification

HIGHLY SENSITIVE.

## Retention

Short-lived.

Recommended:
delete or purge within 24–72 hours after expiry.

Never store plaintext OTP.

---

# 8. USER_PROFILE

## Table

`user_profiles`

## Purpose

Primary public and semi-public profile attributes.

One-to-one with users.

## Fields

### user_id
UUID PK/FK.

### first_name
VARCHAR(50)

Required.

PUBLIC.

### last_name
VARCHAR(80) nullable.

PRIVATE by default.

### gender_code
Enum/reference.

USER-CONTROLLED/SENSITIVE depending on context.

### gender_self_description
VARCHAR(80) nullable.

SENSITIVE.

### bio
VARCHAR(300) nullable.

PUBLIC after moderation.

### profession_title
VARCHAR(80) nullable.

USER-CONTROLLED.

### industry_code
FK/reference nullable.

USER-CONTROLLED.

### hometown_city
VARCHAR(100) nullable.

USER-CONTROLLED.

### hometown_region
VARCHAR(100) nullable.

### profile_completion_percent
SMALLINT.

0–100.

Derived value may be stored/cacheable.

### primary_photo_id
UUID nullable initially.

FK → user_photos.id.

### created_at
### updated_at

---

## Constraints

- profile_completion_percent between 0 and 100;
- public profile API must apply privacy projection.

---

# 9. GENDER_REFERENCE

Prefer controlled configuration table rather than hard-coded values.

## Table

`gender_options`

Fields:

- code;
- label;
- active;
- display_order;
- created_at;
- updated_at.

Initial codes:

```text id="dfbufd"
WOMAN
MAN
NON_BINARY
SELF_DESCRIBE
PREFER_NOT_TO_SAY
```

Dating compatibility may require future taxonomy extension.

---

# 10. USER_PHOTOS

## Table

`user_photos`

## Purpose

Profile image metadata.

Actual binary object stored in object storage.

## Fields

### id
UUID PK.

### user_id
UUID FK.

### storage_key
VARCHAR.

PRIVATE/internal.

### public_delivery_url
Do not persist signed temporary URLs.

Generate/CDN dynamically.

### media_type
VARCHAR.

### width
INTEGER.

### height
INTEGER.

### file_size_bytes
BIGINT.

### sort_order
SMALLINT.

### is_primary
BOOLEAN.

### moderation_status
Enum:

```text id="e008z4"
PENDING
APPROVED
REJECTED
UNDER_REVIEW
```

### moderation_reason_code
nullable.

### uploaded_at

### moderated_at

### removed_at
nullable.

---

## Constraints

Maximum six active images per user.

Exactly one approved primary photo once profile is active.

---

## Indexes

- user_id;
- `(user_id, sort_order)`;
- moderation_status.

---

# 11. USER_LANGUAGES

## Table

`user_languages`

## Fields

### user_id
FK.

### language_code
FK → languages.code.

### proficiency_code
nullable.

Possible future:

```text id="84ovmu"
NATIVE
FLUENT
CONVERSATIONAL
```

### created_at

Composite PK:

`(user_id, language_code)`

---

# 12. LANGUAGES

## Table

`languages`

Fields:

- code;
- display_name;
- native_name optional;
- active;
- display_order.

Initial configured set from PRD.

---

# 13. USER_INTERESTS

## Table

`user_interests`

Fields:

### user_id
UUID.

### interest_id
UUID.

### created_at

Composite PK:

`(user_id, interest_id)`

---

# 14. INTERESTS

## Table

`interests`

## Fields

### id
UUID.

### code
VARCHAR unique.

Example:

`BADMINTON`

### label
VARCHAR.

Example:
Badminton

### category_id
FK.

### active
BOOLEAN.

### display_order
INTEGER.

### icon_key
nullable.

### created_at
### updated_at

---

# 15. INTEREST_CATEGORIES

## Table

`interest_categories`

Initial categories:

- SPORTS
- ENTERTAINMENT
- LIFESTYLE
- OUTDOORS
- CULTURE
- PROFESSIONAL

Fields:

- id;
- code;
- label;
- display_order;
- active.

---

# 16. USER_INTENTS

## Table

`user_intents`

## Fields

### user_id
UUID.

### intent_code
Enum/reference.

### active
BOOLEAN.

### selected_at

### deselected_at nullable.

Composite unique:

`(user_id, intent_code)`

---

# 17. INTENT_OPTIONS

## Table

`intent_options`

Initial:

```text id="0bmyzz"
FRIENDSHIP
ACTIVITIES
NETWORKING
DATING
CASUAL_DATING
SERIOUS_RELATIONSHIP
```

Better modeling:

Top-level intents and dating sub-intents should be separately distinguishable.

Fields:

- code;
- parent_code nullable;
- label;
- active;
- display_order.

---

# 18. DATING_CONSENTS

## Table

`dating_consents`

## Purpose

Versioned evidence of affirmative dating consent.

## Fields

### id
UUID.

### user_id
UUID.

### policy_version
VARCHAR.

### consented_at
TIMESTAMPTZ.

### revoked_at
nullable.

### source
Enum:

```text id="g3v40q"
ONBOARDING
SETTINGS
OTHER
```

### ip_hash/device metadata optional according to privacy policy.

Classification:
SENSITIVE.

---

# 19. DATING_PREFERENCES

## Table

`dating_preferences`

One-to-one per dating-enabled user.

## Fields

### user_id
UUID PK.

### min_age
SMALLINT.

Minimum:
18.

### max_age
SMALLINT.

### max_distance_miles
INTEGER.

### relationship_intent_code
nullable.

### updated_at

Gender/orientation preference should be modeled carefully.

Recommended separate junction table:

`dating_gender_preferences`

rather than comma-separated list.

---

# 20. DATING_GENDER_PREFERENCES

## Fields

- user_id;
- gender_code;
- created_at.

Composite PK.

Classification:
SENSITIVE.

---

# 21. USER_LOCATIONS

## Table

`user_locations`

## Purpose

Current active discovery geography.

## Fields

### user_id
UUID PK.

### city_id
UUID.

### metro_id
UUID.

### country_code
CHAR(2).

### latitude
DECIMAL(9,6) nullable.

### longitude
DECIMAL(9,6) nullable.

Classification:
SENSITIVE.

### precision_type
Enum:

```text id="695mlk"
DEVICE
MANUAL_CITY
APPROXIMATE
```

### source
Enum:

```text id="yq49i2"
GPS
MANUAL
IP_APPROXIMATION
```

### captured_at
TIMESTAMPTZ.

### updated_at

---

## Security Rule

Latitude and longitude:

- not returned from public APIs;
- access restricted;
- logs must not include raw values.

---

# 22. CITIES

## Table

`cities`

Fields:

- id;
- name;
- state_region;
- country_code;
- metro_id;
- latitude centroid;
- longitude centroid;
- active;
- launch_status.

Launch status:

```text id="rkhqcy"
ACTIVE
WAITLIST
FUTURE
DISABLED
```

---

# 23. METROS

## Table

`metros`

Fields:

- id;
- code;
- name;
- country_code;
- timezone;
- active;
- launch_status.

Example:

`DFW`

Timezone:

`America/Chicago`

---

# 24. USER_PRIVACY_SETTINGS

## Table

`user_privacy_settings`

One row per user.

## Fields

### user_id

### show_approximate_distance
BOOLEAN default true.

### show_profession
BOOLEAN default true.

### show_languages
BOOLEAN default true.

### show_event_attendance
BOOLEAN default false or conservative initial choice.

### discoverable
BOOLEAN.

Could mirror canonical users.discoverable; choose one source of truth.

Recommendation:

Use `users.discoverable` as canonical operational flag and keep preferences domain for display settings.

### dating_discoverable
BOOLEAN.

Should align with consent and intent rules.

### updated_at

---

# 25. USER_NOTIFICATION_PREFERENCES

## Table

`user_notification_preferences`

Fields:

- user_id;
- connection_requests_enabled;
- messages_enabled;
- events_enabled;
- community_updates_enabled;
- product_updates_enabled;
- marketing_enabled;
- updated_at.

Critical account/security messages are not represented as opt-out.

---

# 26. USER_VERIFICATIONS

## Table

`user_verifications`

## Purpose

Tracks verification workflows.

## Fields

### id
UUID.

### user_id

### verification_type

```text id="n4e5vo"
PHONE
SELFIE
IDENTITY
```

IDENTITY future only.

### provider
nullable.

### provider_reference
encrypted/private.

### status

```text id="g6appb"
NOT_STARTED
PENDING
VERIFIED
FAILED
MANUAL_REVIEW
EXPIRED
REVOKED
```

### started_at
### completed_at
### expires_at nullable
### failure_reason_code nullable
### created_at
### updated_at

---

# 27. VERIFICATION_ARTIFACTS

If external vendor does not fully own retention.

Table:

`verification_artifacts`

Fields:

- id;
- verification_id;
- artifact_type;
- storage_key;
- retention_until;
- created_at;
- deleted_at.

Classification:
HIGHLY SENSITIVE.

Access:
extremely restricted.

Prefer provider-hosted evidence rather than retaining raw biometric material if business/legal requirements permit.

---

# 28. CONNECTION_REQUESTS

## Table

`connection_requests`

## Fields

### id
UUID PK.

### sender_user_id
FK users.

### recipient_user_id
FK users.

### reason_code
FK/reference.

### intro_message
VARCHAR(200) nullable.

Classification:
PRIVATE.

### status

```text id="ukr2cf"
PENDING
ACCEPTED
DECLINED
CANCELLED
EXPIRED
INVALIDATED
```

### sent_at
### responded_at nullable
### expires_at
### cancelled_at nullable
### invalidation_reason nullable
### created_at
### updated_at

---

## Critical Constraints

Sender != recipient.

Unique partial constraint:

Only one active PENDING request between same sender/recipient pair.

Potential directional uniqueness.

---

## Indexes

- recipient + status + sent_at;
- sender + status;
- expires_at;
- pair lookup.

---

# 29. CONNECTION_REASONS

## Table

`connection_reasons`

Initial codes:

```text id="6tr1fg"
FRIENDSHIP
COFFEE
DINING
SPORTS_ACTIVITY
NETWORKING
LOCAL_COMMUNITY
DATING
SERIOUS_RELATIONSHIP
OTHER
```

Fields:

- code;
- label;
- required_intent_code nullable;
- active;
- display_order.

---

# 30. CONNECTIONS

## Table

`connections`

## Purpose

Canonical mutual relationship.

## Fields

### id
UUID.

### user_low_id
UUID.

### user_high_id
UUID.

Normalize pair ordering to prevent duplicate rows.

### source_request_id
UUID.

### status

```text id="rlncyu"
ACTIVE
DISCONNECTED
BLOCKED
```

Recommendation:

BLOCKED may remain represented independently in `user_blocks`; connection status can be INACTIVE.

Better:

```text id="msizye"
ACTIVE
DISCONNECTED
```

Block is separate policy layer.

### connected_at
### disconnected_at
### disconnected_by_user_id
### created_at
### updated_at

---

## Constraint

Unique:

`(user_low_id, user_high_id)`

---

# 31. CONVERSATIONS

## Table

`conversations`

V1 one-to-one.

## Fields

### id
UUID.

### connection_id
UUID unique FK.

### status

```text id="0wwzis"
ACTIVE
READ_ONLY
CLOSED
```

### created_at
### updated_at
### last_message_at nullable

---

# 32. CONVERSATION_PARTICIPANTS

Even for one-to-one, use this table if future group conversations may eventually exist.

## Table

`conversation_participants`

Fields:

- conversation_id;
- user_id;
- joined_at;
- left_at nullable;
- muted_at nullable;
- last_read_message_id nullable;
- last_read_at nullable.

Composite PK.

For V1:
exactly two participants.

---

# 33. MESSAGES

## Table

`messages`

## Fields

### id
UUID.

### conversation_id
UUID.

### sender_user_id
UUID.

### client_message_id
UUID/string.

Used for idempotency.

### message_type

```text id="ak95nr"
TEXT
IMAGE
SYSTEM
```

IMAGE gated by feature flag.

### body
TEXT nullable depending type.

Max application validation:
2,000 chars.

### media_id
nullable.

### sent_at
### edited_at nullable future
### deleted_at nullable
### moderation_status optional.

---

## Indexes

- `(conversation_id, sent_at DESC)`;
- unique `(sender_user_id, client_message_id)`;
- sender_user_id;
- sent_at.

---

# 34. MESSAGE_MEDIA

If image messaging enabled.

Fields:

- id;
- message_id;
- storage_key;
- mime_type;
- width;
- height;
- moderation_status;
- created_at.

---

# 35. USER_BLOCKS

## Table

`user_blocks`

## Fields

### blocker_user_id
UUID.

### blocked_user_id
UUID.

### reason_code
nullable/internal.

### created_at

Composite PK:

`(blocker_user_id, blocked_user_id)`

---

## Constraints

blocker != blocked.

Blocking is directional but product experience suppresses visibility mutually.

---

## Indexes

Both directions required:

- blocker → blocked;
- blocked → blocker.

---

# 36. REPORTS

## Table

`reports`

## Fields

### id
UUID.

### reporter_user_id
UUID.

### subject_user_id
UUID nullable where event report.

### subject_event_id
UUID nullable.

### source_type

```text id="91xo4l"
PROFILE
CONVERSATION
MESSAGE
EVENT
OTHER
```

### source_id
UUID nullable.

### category_code
FK.

### detail_text
VARCHAR(1000) nullable.

### severity

```text id="u5r93i"
LOW
MEDIUM
HIGH
CRITICAL
```

### status

```text id="66eh2g"
OPEN
TRIAGED
IN_REVIEW
RESOLVED
DISMISSED
ESCALATED
```

### submitted_at
### assigned_admin_id nullable
### resolved_at nullable
### resolution_code nullable
### created_at
### updated_at

---

## Classification

SENSITIVE.

---

# 37. REPORT_CATEGORIES

Initial codes:

```text id="k4d1l2"
FAKE_PROFILE
SPAM
HARASSMENT
INAPPROPRIATE_MESSAGES
SEXUAL_CONTENT
HATE_ABUSE
IMPERSONATION
SCAM_FRAUD
UNDERAGE_CONCERN
SAFETY_THREAT
OTHER
```

Fields:

- code;
- label;
- default_severity;
- active;
- display_order.

---

# 38. REPORT_EVIDENCE

## Table

`report_evidence`

Fields:

- id;
- report_id;
- evidence_type;
- message_id nullable;
- media_id nullable;
- snapshot_storage_key nullable;
- created_at;
- retention_until.

Classification:
HIGHLY SENSITIVE.

Do not copy entire conversations unnecessarily.

---

# 39. MODERATION_ACTIONS

## Table

`moderation_actions`

## Fields

### id
UUID.

### target_user_id
UUID.

### admin_user_id
UUID.

### report_id
nullable.

### action_code

```text id="o58mt3"
WARNING
LIMIT_ACCOUNT
PLACE_UNDER_REVIEW
SUSPEND
BAN
RESTORE
NOTE_ONLY
```

### reason_code
required.

### internal_note
TEXT nullable.

### previous_account_status
nullable.

### resulting_account_status
nullable.

### effective_at
### expires_at nullable
### reversed_at nullable
### reversed_by_admin_id nullable
### created_at

---

## Classification

HIGHLY SENSITIVE internal.

---

# 40. ADMIN_USERS

## Table

`admin_users`

Fields:

- id;
- identity_provider_subject;
- email;
- display_name;
- status;
- mfa_required;
- created_at;
- last_login_at.

Do not mix consumer and staff identities unless architecture explicitly supports it.

---

# 41. ADMIN_ROLES

## Table

`admin_roles`

Codes:

```text id="fcpnpf"
SUPER_ADMIN
MODERATOR
EVENT_MANAGER
SUPPORT_AGENT
```

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](SPEC-RECONCILIATION.md) R-10:** `SUPPORT_AGENT` added per the Authorization Spec. All staff roles require MFA (R-07).

---

# 42. ADMIN_USER_ROLES

Junction:

- admin_user_id;
- role_code;
- granted_by;
- granted_at;
- revoked_at.

Audit required.

---

# 43. ORGANIZERS

## Table

`organizers`

Represents approved event organizer identity.

May be tied to consumer user or organization.

## Fields

### id
UUID.

### owner_user_id
nullable.

### organization_name
nullable.

### display_name

### description
nullable.

### status

```text id="wcmcbd"
PENDING
APPROVED
SUSPENDED
REVOKED
```

### contact_email
PRIVATE.

### approved_by_admin_id
nullable.

### approved_at
nullable.

### created_at
### updated_at

---

# 44. EVENTS

## Table

`events`

## Fields

### id
UUID.

### organizer_id
UUID.

### title
VARCHAR(150).

### description
TEXT.

### category_code
FK.

### cover_media_id
nullable.

### start_at
TIMESTAMPTZ.

### end_at
TIMESTAMPTZ.

### timezone
VARCHAR.

Store explicit event timezone.

### venue_name
VARCHAR.

### venue_address
VARCHAR.

Note:

Event venues are intentionally public locations; this differs from private user location.

### latitude
nullable.

### longitude
nullable.

### metro_id
UUID.

### capacity
INTEGER nullable.

NULL may mean unlimited.

### waitlist_enabled
BOOLEAN.

### attendee_visibility_enabled
BOOLEAN.

### eligibility_type
Enum/config.

### is_paid
BOOLEAN.

### external_ticket_url
nullable for V1 if external.

### status

```text id="84hc05"
DRAFT
PUBLISHED
FULL
CANCELLED
COMPLETED
ARCHIVED
```

### published_at
### cancelled_at
### cancellation_reason nullable
### created_at
### updated_at

---

## Constraints

end_at > start_at.

capacity > 0 when non-null.

---

# 45. EVENT_CATEGORIES

Codes:

```text id="5hnyrr"
SOCIAL
SPORTS
CULTURAL
PROFESSIONAL
DATING
OTHER
```

Fields:

- code;
- label;
- active;
- display_order.

---

# 46. EVENT_RSVPS

## Table

`event_rsvps`

## Fields

### id
UUID.

### event_id
UUID.

### user_id
UUID.

### status

```text id="g99kp7"
GOING
WAITLISTED
CANCELLED
```

### attendee_visibility_opt_in
BOOLEAN.

### rsvp_at
### cancelled_at nullable
### waitlist_position nullable
### created_at
### updated_at

---

## Constraint

One logical RSVP per user/event.

Unique:

`(event_id, user_id)`

---

# 47. EVENT_REMINDERS

Optional scheduled-state table.

Fields:

- id;
- event_id;
- user_id;
- reminder_type;
- scheduled_for;
- sent_at;
- status.

May instead use job system.

---

# 48. NOTIFICATIONS

## Table

`notifications`

## Fields

### id
UUID.

### user_id
UUID.

### type_code
VARCHAR.

### title
VARCHAR.

### body
VARCHAR/text.

No sensitive information.

### entity_type
nullable.

### entity_id
nullable.

### deep_link
nullable structured route.

### read_at
nullable.

### created_at

### expires_at
nullable.

---

## Index

`(user_id, created_at DESC)`

---

# 49. PUSH_DEVICES

## Table

`push_devices`

## Purpose

Stores mobile push registrations.

## Fields

### id
UUID.

### user_id
UUID.

### platform

```text id="0czx14"
IOS
ANDROID
```

### push_token
encrypted/private.

### app_version
### os_version
### device_model
### enabled
### last_seen_at
### created_at
### updated_at

---

# 50. SUBSCRIPTIONS

## Table

`subscriptions`

## Fields

### id
UUID.

### user_id
UUID.

### provider

```text id="bjui73"
APPLE
GOOGLE
```

### product_code
VARCHAR.

Example:

`CONNECT_PLUS_MONTHLY`

### provider_subscription_id
PRIVATE.

### status

```text id="5qyzo9"
ACTIVE
GRACE_PERIOD
PAST_DUE
CANCELLED
EXPIRED
REVOKED
```

### started_at
### current_period_start
### current_period_end
### cancelled_at nullable
### expiration_at nullable
### auto_renew
BOOLEAN nullable
### last_validated_at
### created_at
### updated_at

---

# 51. ENTITLEMENTS

Do not derive every entitlement directly in mobile.

## Table

`user_entitlements`

Fields:

### user_id
### entitlement_code

Examples:

```text id="4azzik"
ADVANCED_FILTERS
VERIFIED_ONLY_FILTER
HIGHER_CONNECTION_LIMIT
PROFILE_INSIGHTS
```

### source_type

```text id="yrgjlr"
SUBSCRIPTION
PROMOTION
ADMIN
EXPERIMENT
```

### source_id
nullable.

### valid_from
### valid_until nullable
### revoked_at nullable.

Composite logical uniqueness.

---

# 52. PRODUCT_CATALOG

## Table

`subscription_products`

Fields:

- product_code;
- display_name;
- plan_tier;
- billing_period;
- active;
- entitlement_bundle_code;
- platform product identifiers;
- launch market;
- created_at;
- updated_at.

Do not hard-code App Store product IDs throughout backend.

---

# 53. PURCHASE_EVENTS

## Purpose

Audit provider purchase lifecycle/webhooks.

Fields:

- id;
- provider;
- provider_event_id unique;
- user_id nullable initially;
- event_type;
- payload_reference/encrypted payload;
- received_at;
- processed_at;
- status;
- error_code.

Supports idempotency.

---

# 54. FEATURE_FLAGS

## Table

`feature_flags`

Fields:

- key;
- description;
- enabled;
- rollout_percent;
- target_market nullable;
- metadata JSONB;
- updated_by_admin_id;
- updated_at.

Examples:

- dating_enabled;
- premium_enabled;
- selfie_verification_enabled;
- attendee_discovery_enabled;
- image_messaging_enabled.

---

# 55. APP_CONFIG

## Table

`app_config`

Key/value for configuration.

Examples:

```text id="hl6wgs"
connection.free_daily_limit
connection.plus_daily_limit
connection.request_expiry_days
connection.retry_after_decline_days
discovery.default_radius_miles
discovery.max_radius_miles
profile.max_photos
message.max_length
```

Use typed configuration validation.

Avoid arbitrary unvalidated JSON.

---

# 56. DISCOVERY_IMPRESSIONS

## Table

`discovery_impressions`

## Purpose

Track whether target has been shown to viewer.

Fields:

- id;
- viewer_user_id;
- target_user_id;
- mode;
- ranking_score optional;
- ranking_version;
- shown_at;
- opened_at nullable;
- request_sent_at nullable;
- session_id.

Potential high volume.

May eventually move to analytics warehouse instead of transactional PostgreSQL.

V1 can store selectively.

---

# 57. DISCOVERY_SUPPRESSIONS

Optional but useful.

## Table

`discovery_suppressions`

Fields:

- viewer_user_id;
- target_user_id;
- reason_code;
- starts_at;
- ends_at nullable.

Reasons:

```text id="zwbtyh"
DECLINED
REPEATED_IMPRESSION
USER_DISMISSED
SAFETY
ADMIN
```

Block remains separate source of truth.

---

# 58. REFERRALS

## Table

`referral_links`

Fields:

- id;
- inviter_user_id;
- referral_code;
- campaign_code nullable;
- event_id nullable;
- created_at;
- expires_at nullable.

---

# 59. REFERRAL_CONVERSIONS

Fields:

- id;
- referral_link_id;
- referred_user_id;
- signup_at;
- activated_at nullable.

---

# 60. SUPPORT_CASES

## Table

`support_cases`

Fields:

- id;
- user_id;
- category_code;
- subject;
- description;
- status;
- priority;
- assigned_admin_id nullable;
- created_at;
- updated_at;
- resolved_at nullable.

Classification:
PRIVATE/SENSITIVE depending case.

---

# 61. SUPPORT_ATTACHMENTS

Fields:

- id;
- support_case_id;
- storage_key;
- mime_type;
- created_at.

Malware scan required if file uploads supported.

---

# 62. AUDIT_EVENTS

## Table

`audit_events`

## Purpose

Tamper-resistant operational audit history.

## Fields

### id
UUID.

### actor_type

```text id="j47jqk"
USER
ADMIN
SYSTEM
SERVICE
```

### actor_id
nullable.

### action_code

### entity_type

### entity_id

### before_state
JSONB nullable.

### after_state
JSONB nullable.

### reason_code
nullable.

### correlation_id

### ip_hash
optional.

### created_at

---

## Rules

Audit events should be append-only.

Avoid storing sensitive payload unnecessarily.

---

# 63. USER_ACTIVITY_EVENTS

Transactional operational activity, separate from analytics warehouse.

Possible fields:

- user_id;
- activity_type;
- entity_type;
- entity_id;
- occurred_at.

Use sparingly.

Do not duplicate entire analytics platform unnecessarily.

---

# 64. ANALYTICS EVENT MODEL

Primary product analytics should typically go to dedicated analytics pipeline rather than transactional database.

Canonical event envelope:

```text id="vckxbr"
event_name
event_id
occurred_at
user_id_pseudonymous
session_id
screen_id
source_screen
app_version
platform
metro_code
feature_flag_context
properties
```

Explicitly prohibited:

- phone number;
- email;
- OTP;
- private message text;
- precise latitude/longitude;
- authentication token.

---

# 65. ENUM GOVERNANCE

Enums requiring frequent business change should preferably be reference/configuration tables rather than PostgreSQL native ENUM types.

Use DB-native enums only where lifecycle is extremely stable.

Good native-enum candidates:

- account_status perhaps;
- message type perhaps.

Good reference-table candidates:

- interests;
- languages;
- report categories;
- event categories;
- connection reasons.

---

# 66. PUBLIC PROFILE PROJECTION

Never return raw `users` + `user_profiles` rows directly.

Create an application-level projection.

Example:

```text id="igc6in"
PublicProfile {
  userId
  firstName
  age
  primaryPhoto
  photos
  city
  approximateDistance
  verificationStatus
  bio
  profession?        // privacy controlled
  languages?         // privacy controlled
  interests
  sharedInterests
  compatibleIntents
}
```

Excluded:

- DOB;
- phone;
- email;
- precise coordinates;
- internal account status detail;
- moderation history;
- dating preference internals.

---

# 67. INTERNAL USER PROJECTION

For self-profile endpoint:

May return:

- account fields;
- privacy settings;
- active intentions;
- subscription;
- profile completion;
- verification status.

Still do not expose security secrets.

---

# 68. ADMIN USER PROJECTION

Admin APIs must be role-aware.

Moderator may see:

- report-relevant details;
- profile;
- status;
- limited contact information if operationally necessary.

Event manager should not automatically see:

- moderation evidence;
- private messages;
- authentication metadata.

---

# 69. DATA OWNERSHIP MATRIX

| Domain | Primary Owner |
|---|---|
| User identity | Identity Service |
| Profile | Profile Service |
| Location | Profile/Discovery domain |
| Intent | Profile domain |
| Dating | Dating policy domain |
| Connections | Connection Service |
| Messages | Messaging Service |
| Reports | Trust & Safety |
| Events | Event Service |
| Subscriptions | Billing/Entitlement Service |
| Admin roles | Admin/Identity |
| Audit | Platform Security |
| Analytics | Data/Analytics |

Even if V1 uses a modular monolith, ownership should remain conceptually separated.

---

# 70. RELATIONSHIP CARDINALITY

## User → Profile

1:1

## User → Photos

1:N

## User → Languages

N:M

## User → Interests

N:M

## User → Intents

N:M

## User → Location

1:1 active V1.

Future location history may be separate.

## User → Connection Requests

1:N as sender.

1:N as recipient.

## Users ↔ Connection

N:M represented by pair relationship.

## Connection → Conversation

1:1 V1.

## Conversation → Messages

1:N.

## User → Reports

1:N reporter.

1:N subject.

## User → Event RSVPs

1:N.

## Event → RSVPs

1:N.

---

# 71. CRITICAL UNIQUE CONSTRAINTS

At minimum:

```text id="v0m3ws"
users.active_phone unique

auth_identities(provider, provider_subject) unique

user_languages(user_id, language_code) unique

user_interests(user_id, interest_id) unique

user_intents(user_id, intent_code) unique

user_blocks(blocker_user_id, blocked_user_id) unique

event_rsvps(event_id, user_id) unique

connections(normalized_user_pair) unique

messages(sender_user_id, client_message_id) unique

purchase_events(provider, provider_event_id) unique
```

---

# 72. CRITICAL CHECK CONSTRAINTS

Examples:

```text id="c15r9v"
connection sender != recipient

blocker != blocked

event end_at > start_at

capacity IS NULL OR capacity > 0

dating min_age >= 18

dating max_age >= min_age

profile completion between 0 and 100

photo sort_order within range

message body length <= configured application maximum
```

Application checks remain required even where DB constraints exist.

---

# 73. INDEX STRATEGY — DISCOVERY

Discovery queries are performance-sensitive.

Likely useful indexes:

- users `(account_status, discoverable)`;
- user_locations `(metro_id, city_id)`;
- geospatial location index if PostGIS used;
- user_intents `(intent_code, user_id)`;
- user_languages `(language_code, user_id)`;
- user_interests `(interest_id, user_id)`;
- user_verifications `(user_id, status, verification_type)`;
- last_active_at.

Do not create dozens of speculative indexes.

Validate with real query plans.

---

# 74. POSTGIS RECOMMENDATION

If proximity search is core, enable:

**PostGIS**

Recommended derived geography column:

`geography(Point, 4326)`

Benefits:

- radius queries;
- distance calculation;
- spatial indexes.

Never expose raw point publicly.

Example server-level function:

`ST_DWithin()`

---

# 75. MESSAGE INDEX STRATEGY

Critical index:

```text id="hjbew9"
(conversation_id, sent_at DESC)
```

Supports paginated message history.

Use cursor pagination:

`sent_at + id`

rather than large OFFSET.

---

# 76. CONNECTION REQUEST INDEXES

Incoming queue:

```text id="1gt06l"
(recipient_user_id, status, sent_at DESC)
```

Outgoing:

```text id="xfdn7f"
(sender_user_id, status, sent_at DESC)
```

Expiration worker:

```text id="6n4f13"
(status, expires_at)
WHERE status='PENDING'
```

---

# 77. EVENTS INDEXES

Suggested:

- `(metro_id, status, start_at)`;
- `(organizer_id, start_at)`;
- category + date;
- RSVP `(user_id, status)`.

---

# 78. REPORT QUEUE INDEXES

Moderator queue:

```text id="hu73qk"
(status, severity, submitted_at)
```

Subject history:

`subject_user_id`

Reporter abuse analysis:

`reporter_user_id`

---

# 79. DATA RETENTION FRAMEWORK

Exact duration requires final legal/safety policy.

However ownership must be defined now.

---

# 80. OTP RETENTION

Short-term only.

Recommended maximum operational retention:

72 hours.

Prefer purge earlier.

---

# 81. SESSION/TOKEN DATA

Retain only for active security need.

Expired credentials/tokens:

purge according to security policy.

---

# 82. PROFILE DATA

Retain while account active.

Upon deletion:

delete or anonymize according to legal retention rules.

---

# 83. MESSAGES

Retention policy must be formally approved.

Do not automatically delete on disconnect because:

- users may need history;
- safety investigations may require evidence.

Deletion policy must separate:

user-visible deletion vs legal/safety retention.

---

# 84. REPORTS

Reports and enforcement history may require longer retention than ordinary profile data for:

- abuse prevention;
- appeals;
- fraud defense;
- legal obligations.

Exact duration pending Trust & Safety policy.

---

# 85. BLOCKS

Retain while either account exists unless specific deletion policy dictates otherwise.

A deleted user's identifier may need pseudonymous preservation to maintain protection against abusive re-registration, subject to legal review.

---

# 86. AUDIT EVENTS

High-value security/admin audit events should have longer retention.

Potential:
multiple years.

Exact duration to be defined in security/legal policy.

---

# 87. LOCATION RETENTION

V1 should store only current operational location unless history has explicit product requirement.

Avoid creating location history by default.

If coordinates update:

overwrite active value rather than accumulating precise movement history.

---

# 88. VERIFICATION DATA

Raw selfie/biometric artifacts should have the shortest feasible retention.

Prefer:

- provider-hosted processing;
- retain verification status/reference only.

Requires vendor/legal decision.

---

# 89. PAYMENT DATA

Do not store:

- full credit-card numbers;
- CVV.

App stores/provider handle payment credentials.

Store:

- provider transaction/subscription IDs;
- entitlement state;
- audit events.

---

# 90. DATA DELETION WORKFLOW

Deletion is not a single SQL DELETE.

Conceptual workflow:

```text id="euancq"
User requests deletion
↓
Re-authenticate
↓
Set DELETION_PENDING
↓
Immediately hide account
↓
Revoke active sessions
↓
Cancel/suppress discovery
↓
Apply domain-specific deletion/anonymization
↓
Retain permitted safety/legal records
↓
Mark DELETED
↓
Record completion audit
```

---

# 91. DELETION DOMAIN BEHAVIOR

## Public Profile

Delete/anonymize.

## Photos

Delete object storage.

## Precise Location

Delete.

## Phone/Email

Delete/anonymize unless minimal hashed fraud-control artifact legally permitted.

## Connections

Replace deleted participant display appropriately.

## Messages

Handle according to retention policy; other participant's conversation integrity must be considered.

## Reports

May retain pseudonymized references.

## Audit

Retain non-excessive compliance history.

---

# 92. PSEUDONYMIZATION

Where deletion cannot remove operational records:

replace user-identifying values with non-reversible pseudonymous identifier.

Do not use phone/email as retained identifier.

---

# 93. SECURITY AT REST

Sensitive columns should use:

- encrypted database storage;
- managed KMS;
- optionally field-level encryption for high-risk fields.

Candidates:

- phone;
- email;
- push token;
- provider IDs;
- verification references;
- precise geolocation if warranted.

---

# 94. SECURITY IN LOGS

Never log:

- OTP;
- session token;
- refresh token;
- exact message content by default;
- full phone number;
- exact coordinates;
- biometric artifact;
- receipt payload if sensitive.

Use masked values.

---

# 95. DATA ACCESS PATTERN — MOBILE

Mobile app must never connect directly to database.

All data access:

```text id="42gcv1"
Mobile
↓
Authenticated API
↓
Domain service
↓
Authorization/Policy
↓
Repository
↓
Database
```

---

# 96. NO DIRECT PUBLIC STORAGE ACCESS

Photo uploads should use limited signed upload mechanisms.

Photo reads via controlled CDN/object URL.

Private verification evidence must never share public bucket/policy.

---

# 97. MEDIA STORAGE PARTITIONING

Recommended logical separation:

```text id="gc9lsg"
public-profile-media/

message-media/

event-media/

support-media/

verification-private/
```

Different access policies.

---

# 98. DATABASE SCHEMA NAMESPACES

Optional but recommended in PostgreSQL:

```text id="9hmjc5"
identity.*
profile.*
social.*
messaging.*
events.*
safety.*
billing.*
admin.*
platform.*
```

Whether separate SQL schemas or logical modules depends implementation style.

Avoid one undifferentiated 100-table namespace if maintainability suffers.

---

# 99. EVENTUAL ANALYTICS WAREHOUSE

Transactional PostgreSQL is not the long-term analytics platform.

Future architecture:

```text id="nf4esu"
Application Events
↓
Event Stream / Analytics Collector
↓
Warehouse
↓
BI / Product Analytics
```

Do not run expensive retention analytics against primary transactional database.

---

# 100. DATABASE TRANSACTIONS

Mandatory transactional boundaries:

## Connection Acceptance

Within transaction:

1. lock pending request;
2. validate state;
3. mark ACCEPTED;
4. create/update connection;
5. create conversation;
6. create participants;
7. write outbox event.

Commit.

---

# 101. OUTBOX PATTERN

Recommended for reliable async side effects.

## Table

`outbox_events`

Fields:

- id;
- aggregate_type;
- aggregate_id;
- event_type;
- payload;
- created_at;
- published_at;
- attempts.

Example after connection acceptance:

```text id="192rdv"
CONNECTION_ACCEPTED
```

Async consumers:

- push notification;
- analytics;
- email;
- recommendation refresh.

This prevents:

database committed but notification system failed halfway.

---

# 102. IDEMPOTENCY_KEYS

For mutation APIs that may be retried.

Table or cache mechanism:

- key;
- user_id;
- operation;
- response reference;
- expires_at.

Important for:

- connection accept;
- message send;
- RSVP;
- subscription webhooks.

---

# 103. DOMAIN EVENTS

Recommended events:

```text id="td2p1a"
USER_REGISTERED
USER_ACTIVATED
PROFILE_COMPLETED
DATING_ENABLED
DATING_DISABLED
CONNECTION_REQUESTED
CONNECTION_ACCEPTED
CONNECTION_DECLINED
USER_BLOCKED
USER_REPORTED
MESSAGE_SENT
EVENT_PUBLISHED
EVENT_RSVPED
EVENT_CANCELLED
SUBSCRIPTION_ACTIVATED
SUBSCRIPTION_EXPIRED
USER_SUSPENDED
USER_BANNED
USER_DELETION_REQUESTED
USER_DELETED
```

These become integration boundaries.

---

# 104. API IDENTIFIER POLICY

Public API resources should use opaque UUIDs.

Never expose:

- phone;
- email;
- sequential database keys.

---

# 105. PII FIELD INVENTORY

## Direct Identifiers

- phone number;
- email;
- name.

## Quasi Identifiers

- DOB;
- hometown;
- profession;
- city.

## Sensitive Attributes

- dating intent;
- gender preferences;
- precise location.

## High-Sensitivity Operational

- reports;
- moderation evidence;
- verification data.

---

# 106. PRIVACY FIELD MATRIX

| Field | Public | Self | Connected User | Moderator | Admin |
|---|---:|---:|---:|---:|---:|
| First Name | ✓ | ✓ | ✓ | ✓ | ✓ |
| DOB | ✕ | ✓ | ✕ | restricted | restricted |
| Age | contextual ✓ | ✓ | ✓ | ✓ | ✓ |
| Phone | ✕ | ✓ | ✕ | restricted | restricted |
| Email | ✕ | ✓ | ✕ | restricted | restricted |
| City | ✓ | ✓ | ✓ | ✓ | ✓ |
| Exact Coordinates | ✕ | internal only | ✕ | generally ✕ | highly restricted |
| Interests | ✓ | ✓ | ✓ | ✓ | ✓ |
| Languages | user controlled | ✓ | user controlled | ✓ | ✓ |
| Profession | user controlled | ✓ | user controlled | ✓ | ✓ |
| Dating Preferences | ✕ | ✓ | ✕ | safety need only | restricted |
| Report History | ✕ | limited self policy | ✕ | ✓ | ✓ |
| Moderation Notes | ✕ | ✕ | ✕ | ✓ | ✓ |

---

# 107. ENTITY LIFECYCLE — CONNECTION REQUEST

```text id="d1jlw1"
PENDING
 ├── ACCEPTED
 ├── DECLINED
 ├── CANCELLED
 ├── EXPIRED
 └── INVALIDATED
```

Terminal states should not return to PENDING.

---

# 108. ENTITY LIFECYCLE — EVENT

```text id="qnu6l9"
DRAFT
 ↓
PUBLISHED
 ├── FULL
 ├── CANCELLED
 └── COMPLETED
      ↓
    ARCHIVED
```

---

# 109. ENTITY LIFECYCLE — REPORT

```text id="bt38ru"
OPEN
 ↓
TRIAGED
 ↓
IN_REVIEW
 ├── RESOLVED
 ├── DISMISSED
 └── ESCALATED
```

Escalated may later resolve.

---

# 110. ENTITY LIFECYCLE — SUBSCRIPTION

```text id="mzkvxy"
ACTIVE
 ├── GRACE_PERIOD
 ├── CANCELLED
 ├── EXPIRED
 └── REVOKED
```

Provider-specific lifecycle mapping required.

---

# 111. DOMAIN OWNERSHIP RULE

No service/module should mutate another domain's table directly without formal ownership contract.

Example:

Discovery module may read profile projections but should not directly modify profile data.

Messaging should not directly mutate account status.

Trust & Safety invokes Account service to suspend a user.

Even inside modular monolith, follow this boundary.

---

# 112. MODULAR MONOLITH RECOMMENDATION FOR V1

Do not start with dozens of microservices.

Recommended:

**Modular monolith + PostgreSQL + clearly separated domain modules**

Potential modules:

```text id="jbge2e"
Identity
Profile
Discovery
Connections
Messaging
Events
Safety
Billing
Notifications
Admin
```

Can be separated later when scale justifies it.

---

# 113. CACHE CANDIDATES

Redis may support:

- OTP rate limiting;
- session/risk data;
- feature-flag cache;
- discovery cache;
- online/presence status;
- request rate limits;
- idempotency;
- realtime messaging infrastructure.

Redis should not become the system of record for core relationships.

---

# 114. PRESENCE DATA

If V1 introduces online/recently-active indicators, keep ephemeral presence outside PostgreSQL where practical.

Example Redis:

```text id="1tw60a"
presence:user:{id}
```

Do not expose exact user activity times without product/privacy approval.

---

# 115. SEARCH

V1 connection search can use PostgreSQL indexed text search for existing connections.

Do not require Elasticsearch/OpenSearch initially.

Global people search is intentionally not part of product.

---

# 116. DATA MIGRATION STANDARDS

All schema changes must use versioned migrations.

Requirements:

- forward migration;
- backward compatibility plan;
- production safety;
- index creation strategy;
- no destructive unreviewed migration.

Never manually alter production schema.

---

# 117. ZERO-DOWNTIME MIGRATION RULE

For high-volume tables:

Prefer:

```text id="jhqyvf"
Add nullable column
↓
Deploy compatible code
↓
Backfill
↓
Enforce constraint
↓
Remove old behavior later
```

Avoid single disruptive migration.

---

# 118. DATABASE ACCESS SECURITY

Production DB credentials:

- never embedded in mobile app;
- never committed to repository;
- per-environment;
- least privilege.

Separate roles recommended:

- application runtime;
- migration;
- read-only analytics;
- admin operations.

---

# 119. BACKUP REQUIREMENTS

Production PostgreSQL must have:

- automated backups;
- point-in-time recovery;
- encrypted backup storage;
- restore testing.

A backup that has never been restored is not considered proven.

---

# 120. DISASTER RECOVERY DATA REQUIREMENTS

Final architecture should define:

- RPO;
- RTO;
- backup retention;
- restore procedure;
- regional failure strategy.

Exact values belong in Non-Functional/System Architecture.

---

# 121. DATA QUALITY RULES

Automated checks should detect:

- ACTIVE users without profile;
- profiles without approved primary photo;
- active connections without conversation;
- duplicate normalized connections;
- invalid event times;
- dangling media references;
- subscription entitlement inconsistencies;
- users marked discoverable while suspended.

---

# 122. PERIODIC RECONCILIATION JOBS

Recommended:

## Account Consistency

Correct invalid discoverability.

## Subscription Reconciliation

Compare provider status and entitlement state.

## Request Expiration

Move expired PENDING requests to EXPIRED.

## Event Completion

Move elapsed events to COMPLETED.

## Media Cleanup

Remove abandoned uploads.

## Deletion Workflow

Continue pending deletion jobs.

---

# 123. DATABASE OBSERVABILITY

Monitor:

- connection pool;
- slow queries;
- lock wait;
- deadlocks;
- replica lag if introduced;
- storage growth;
- index bloat;
- cache hit ratio;
- table growth;
- failed migrations.

---

# 124. HIGH-GROWTH TABLES

Likely:

- messages;
- notifications;
- audit events;
- analytics/discovery impressions;
- purchase events.

Plan partitioning only when volume demonstrates need.

Do not prematurely partition every table.

---

# 125. MESSAGE PARTITIONING FUTURE

If message scale becomes large:

partition by time or hash conversation.

Not necessary at initial DFW scale.

---

# 126. MULTI-MARKET READINESS

Do not encode DFW directly into schema.

Use:

- country;
- metro;
- city;
- timezone.

Expansion becomes configuration/data, not schema rewrite.

---

# 127. LOCALIZATION READINESS

Taxonomy labels should support future translation.

Potential schema:

`interest_translations`

Not mandatory V1.

At minimum use stable language-independent codes.

---

# 128. FIELD NAMING STANDARD

Database naming:

`snake_case`

Examples:

- `created_at`
- `user_id`
- `account_status`

API may use camelCase if TypeScript conventions require.

Mapping must be systematic.

---

# 129. BOOLEAN NAMING

Use positive booleans where possible.

Good:

- `discoverable`
- `marketing_enabled`

Avoid confusing:

- `not_hidden`
- `disable_notifications`

---

# 130. NULL SEMANTICS

NULL must have documented meaning.

Example:

`event.capacity = NULL`
means unlimited.

Do not use NULL ambiguously to mean:

- unknown;
- zero;
- not applicable;
- disabled

without definition.

---

# 131. MONEY FIELDS

If/when monetary values stored:

Use integer smallest currency unit.

Example:

`price_amount = 1299`

`currency = USD`

Never floating point.

---

# 132. COUNTRY/CURRENCY STANDARDS

Use:

- ISO 3166-1 alpha-2 country codes;
- ISO 4217 currency codes.

---

# 133. TIMEZONE STANDARD

Use IANA timezones.

Example:

`America/Chicago`

Do not store:

`CST`

because DST ambiguity.

---

# 134. PHONE STANDARD

Canonical phone format:

E.164.

Display formatting handled by UI.

---

# 135. AGE STORAGE

Never store a permanently calculated age column as canonical.

Store DOB privately.

Calculate age at runtime or derive/cache safely.

---

# 136. PROFILE AGE EXPOSURE

Public API returns:

`age`

not DOB.

Dating filters calculate against DOB server-side.

---

# 137. APPROXIMATE DISTANCE

Compute distance server-side.

Potential output:

```text id="hlxfwv"
distanceMilesApprox: 8
```

Round/coarsen if necessary for privacy.

Never send target coordinates to client.

---

# 138. BLOCK LOOKUP OPTIMIZATION

Discovery frequently asks:

"Is there a block either direction?"

May use indexed table query or precomputed exclusion list/cache.

Correctness takes priority over cache performance.

---

# 139. PRIVACY PROJECTION SERVICE

Strong recommendation:

Create centralized profile projection policy:

```text id="ilof5a"
ProfileVisibilityService
```

Input:

- viewer;
- target;
- context.

Output:

allowed fields.

Avoid each endpoint manually selecting privacy fields.

---

# 140. DATA ACCESS AUDIT FOR HIGHLY SENSITIVE INFORMATION

Access to:

- verification evidence;
- moderation evidence;
- precise geolocation;
- sensitive admin details

should generate or support security audit records where feasible.

---

# 141. TEST DATA STRATEGY

Never use real production PII in lower environments.

Use synthetic users.

Seed scenarios:

- active verified;
- active unverified;
- dating enabled;
- blocked;
- suspended;
- event organizer;
- premium;
- expired premium.

---

# 142. PRODUCTION DATA ACCESS

Engineering staff should not casually query production PII.

Use:

- role-based access;
- audited break-glass procedures;
- redacted support tooling.

---

# 143. DATABASE TEST REQUIREMENTS

Automated tests must verify:

- foreign key integrity;
- unique constraints;
- request uniqueness;
- connection normalization;
- block uniqueness;
- RSVP uniqueness;
- invalid state transitions rejected;
- subscription webhook idempotency;
- user deletion workflow behavior.

---

# 144. ERD — LOGICAL VIEW

```text id="4narj3"
USERS
 │
 ├── USER_PROFILES
 │    ├── USER_PHOTOS
 │    ├── USER_LANGUAGES ── LANGUAGES
 │    ├── USER_INTERESTS ── INTERESTS
 │    └── USER_INTENTS ── INTENT_OPTIONS
 │
 ├── USER_LOCATIONS ── CITIES ── METROS
 │
 ├── DATING_CONSENTS
 ├── DATING_PREFERENCES
 ├── USER_VERIFICATIONS
 │
 ├── CONNECTION_REQUESTS
 │            │
 │            ▼
 │       CONNECTIONS
 │            │
 │            ▼
 │       CONVERSATIONS
 │            │
 │            ▼
 │         MESSAGES
 │
 ├── USER_BLOCKS
 │
 ├── REPORTS
 │      └── REPORT_EVIDENCE
 │
 ├── EVENT_RSVPS ── EVENTS ── ORGANIZERS
 │
 ├── NOTIFICATIONS
 ├── PUSH_DEVICES
 │
 ├── SUBSCRIPTIONS
 └── USER_ENTITLEMENTS
```

Admin:

```text id="9lc014"
ADMIN_USERS
 │
 ├── ADMIN_USER_ROLES
 ├── MODERATION_ACTIONS
 ├── ORGANIZER_APPROVAL
 └── AUDIT_EVENTS
```

---

# 145. MINIMUM V1 TABLE SET

If engineering needs a clear minimum implementation list:

```text id="f06ip1"
users
auth_identities
otp_challenges

user_profiles
user_photos
languages
user_languages
interest_categories
interests
user_interests
intent_options
user_intents

metros
cities
user_locations
user_privacy_settings
user_notification_preferences

dating_consents
dating_preferences
dating_gender_preferences

user_verifications

connection_reasons
connection_requests
connections

conversations
conversation_participants
messages

user_blocks
report_categories
reports
report_evidence
moderation_actions

organizers
event_categories
events
event_rsvps

notifications
push_devices

subscriptions
user_entitlements
subscription_products
purchase_events

feature_flags
app_config

admin_users
admin_roles
admin_user_roles

audit_events
outbox_events
```

Approximately 40 tables is reasonable for this product because each has a clear domain purpose.

Do not collapse unrelated domains merely to make the schema appear smaller.

---

# 146. TABLES THAT MAY WAIT

Potential P1/later:

```text id="v4pvrg"
discovery_impressions
discovery_suppressions
support_cases
support_attachments
referral_links
referral_conversions
event_reminders
message_media
verification_artifacts
```

Implement when feature scope requires them.

---

# 147. DO NOT STORE THESE IN V1

Unless formally approved:

- immigration status;
- visa type;
- caste;
- religion;
- salary;
- net worth;
- full government identification;
- exact home address;
- continuous GPS history;
- contact book;
- personal social media passwords;
- raw payment card data.

---

# 148. DATA CONTRACT VERSIONING

Public APIs should support additive evolution.

Avoid breaking client contracts.

Recommended:

- typed response DTOs;
- schema validation;
- backward-compatible additions;
- explicit API version only when meaningful breaking change requires it.

---

# 149. GENERATED TYPES

Where possible generate shared TypeScript types from API/OpenAPI schema.

Do not share raw ORM entities with mobile application.

Distinct layers:

```text id="bqxk4f"
Database Entity
↓
Domain Model
↓
API DTO
↓
Mobile Model
```

This prevents accidental PII exposure.

---

# 150. ORM GUIDANCE

ORM is acceptable.

Candidates depend final stack.

Regardless of ORM:

- review generated SQL;
- preserve migrations;
- enforce DB constraints;
- avoid N+1 queries;
- do not let ORM hide performance issues.

---

# 151. REPOSITORY PATTERN

Business services should not directly depend on SQL details everywhere.

Conceptual:

```text id="uy4shn"
ConnectionService
      ↓
ConnectionPolicy
      ↓
ConnectionRepository
      ↓
PostgreSQL
```

---

# 152. PROFILE PROJECTION EXAMPLE

Conceptual result:

```text id="xqgbng"
{
  "id": "usr_...",
  "firstName": "Ananya",
  "age": 31,
  "city": {
    "name": "Plano",
    "metro": "Dallas–Fort Worth"
  },
  "approximateDistanceMiles": 12,
  "verified": true,
  "photos": [...],
  "bio": "...",
  "interests": [...],
  "sharedInterests": [...],
  "languages": [...],
  "compatibleIntents": ["FRIENDSHIP"]
}
```

No raw private fields.

---

# 153. CONNECTION ACCEPTANCE DATA FLOW

```text id="l9psgy"
Request ID
↓
Load request FOR UPDATE
↓
Validate PENDING
↓
Re-run eligibility
↓
Mark ACCEPTED
↓
Normalize user pair
↓
Create Connection
↓
Create Conversation
↓
Add 2 participants
↓
Write Outbox Event
↓
Commit
```

This becomes mandatory architectural behavior.

---

# 154. BLOCK DATA FLOW

```text id="ky3u5h"
Block User
↓
Insert USER_BLOCK
↓
Invalidate pending requests
↓
Deactivate active connection
↓
Set conversation READ_ONLY
↓
Emit USER_BLOCKED
↓
Invalidate discovery caches
```

One transaction where practical.

---

# 155. ACCOUNT DELETION DATA FLOW

```text id="nvsqgq"
Request
↓
DELETION_PENDING
↓
Revoke sessions
↓
discoverable=false
↓
Queue deletion orchestration
↓
Remove private media/location
↓
Anonymize records where needed
↓
Retain legal/safety artifacts according to policy
↓
DELETED
```

---

# 156. ENTITLEMENT DATA FLOW

```text id="9yw7ce"
Store Purchase
↓
Provider Validation
↓
Purchase Event
↓
Subscription Updated
↓
Entitlements Recalculated
↓
Outbox Event
↓
Mobile Refreshes Entitlement
```

No direct trust in local purchase success screen.

---

# 157. DESIGN REVIEW QUESTIONS BEFORE SCHEMA FREEZE

Architecture team must answer:

1. Is modular monolith confirmed?
2. Is PostgreSQL confirmed?
3. Is PostGIS enabled?
4. Which fields require field-level encryption?
5. Which identity provider manages sessions?
6. Is message storage in PostgreSQL V1?
7. Which realtime provider is used?
8. Which selfie provider is used?
9. Are messages retained indefinitely, time-limited, or user-controlled?
10. What deletion retention exceptions apply?
11. How much moderation evidence is retained?
12. Is event payment internal or external?
13. Which subscription entitlement platform is used?
14. Will analytics use Segment/PostHog/Amplitude/etc. or custom?
15. Which object-storage/cloud environment is selected?

These belong to technical architecture decisions, not product assumptions.

---

# 158. SCHEMA FREEZE CRITERIA

This V1 data model can be considered sufficiently frozen for implementation when:

- entity ownership approved;
- P0 tables approved;
- privacy classification approved;
- sensitive retention policies approved;
- subscription provider known;
- verification provider known or abstracted;
- API DTOs designed;
- major constraints accepted;
- migrations tested;
- deletion behavior reviewed.

---

# 159. CLAUDE CODE DATA RULES

Claude Code must never:

- invent fields not required by approved requirements without explaining them;
- expose ORM entities directly through API;
- remove constraints to make tests pass;
- use `any` for domain models;
- store secrets in database config tables;
- expose DOB;
- expose phone/email;
- expose coordinates;
- bypass entitlement checks;
- duplicate relationship tables;
- create uncontrolled JSON blobs where normalized data is required;
- add sensitive demographic attributes without formal product approval.

Any material schema change requires:

1. rationale;
2. affected entities;
3. migration plan;
4. backward compatibility impact;
5. privacy impact;
6. test impact.

---

# 160. FINAL DATA ARCHITECTURE POSITION

Project Connect V1 should use a strongly governed relational model centered around:

**Identity → Profile → Eligibility → Discovery → Connection → Conversation**

with cross-cutting domains for:

**Safety, Events, Billing, Privacy, Administration, and Audit.**

The most important database architecture principles are:

> **Private identity data and public profile data must remain logically separated.**

> **No exact user location reaches a public client response.**

> **Connections are explicit mutual relationships, not followers.**

> **Blocks are independent high-precedence safety relationships.**

> **Messages belong to authorized conversations, never arbitrary user pairs.**

> **Dating data is treated as sensitive and governed separately.**

> **Subscription state enhances functionality but never controls safety.**

> **Moderation and audit records require stronger access controls than ordinary application data.**

> **User deletion is an orchestrated domain process, not a single row deletion.**

> **Database constraints protect core integrity even when application code contains defects.**

---

# 161. AMENDMENT 2026-10-04 — APPROVED ADDITIONS

Approved by [SPEC-RECONCILIATION](SPEC-RECONCILIATION.md) R-10, R-16, R-17. These tables join the canonical implementation model and the §145 minimum table set (`user_sessions`, `user_restrictions` are P0; `moderation_appeals`, `notification_deliveries` ship with the moderation and notification slices). Build them incrementally with their vertical slices.

## 161.1 USER_SESSIONS

Table: `user_sessions`

Purpose: refresh-token rotation, replay detection, session revocation, logout-all-devices.

| Field | Notes |
|---|---|
| id | UUID PK |
| user_id | FK → users.id |
| refresh_token_hash | high-entropy opaque token, stored only as a hash. HIGHLY SENSITIVE. |
| token_family_id | rotation chain; reuse of a rotated token revokes the whole family |
| device_context | minimal device/app metadata |
| created_at | TIMESTAMPTZ |
| last_used_at | TIMESTAMPTZ |
| expires_at | TIMESTAMPTZ |
| revoked_at | TIMESTAMPTZ nullable |
| revocation_reason | nullable (`LOGOUT`, `LOGOUT_ALL`, `REUSE_DETECTED`, `ACCOUNT_ACTION`, …) |

Indexes: `user_id`; unique `refresh_token_hash`; `token_family_id`. Never log token values.

## 161.2 USER_RESTRICTIONS

Table: `user_restrictions`

Structured capability restrictions. Do **not** add per-capability boolean columns to `users`.

| Field | Notes |
|---|---|
| id | UUID PK |
| user_id | FK → users.id |
| capability | `DISCOVER`, `BE_DISCOVERED`, `SEND_REQUESTS`, `RECEIVE_REQUESTS`, `MESSAGE`, `RSVP`, `USE_DATING` |
| enabled | BOOLEAN (false = capability restricted) |
| reason_code | required |
| source | `MODERATION`, `SYSTEM_RISK`, `ADMIN`, … |
| moderation_action_id | nullable FK → moderation_actions.id |
| expires_at | TIMESTAMPTZ nullable |
| created_at | TIMESTAMPTZ |
| revoked_at | TIMESTAMPTZ nullable |

Evaluated in authorization step "safety restriction", after account status and before block checks. Changes are audited and invalidate caches immediately.

## 161.3 MODERATION_APPEALS

Table: `moderation_appeals`

| Field | Notes |
|---|---|
| id | UUID PK |
| user_id | FK → users.id |
| moderation_action_id | FK → moderation_actions.id |
| submitted_at | TIMESTAMPTZ |
| status | `SUBMITTED`, `IN_REVIEW`, `RESOLVED` |
| resolution | `UPHELD`, `OVERTURNED`, `MODIFIED`, `MORE_INFORMATION_REQUIRED` (T&S §106) |
| reviewer_admin_id | nullable FK → admin_users.id (should differ from the original decision-maker where practical) |
| resolved_at | TIMESTAMPTZ nullable |
| reason_code | nullable |
| user_statement | nullable, if allowed. SENSITIVE; staff-restricted access. |

Constraint: one standard appeal per enforcement action (T&S §107). Exact appeal workflow remains an executive decision (Business Rules Part XXXVI #12).

## 161.4 NOTIFICATION_DELIVERIES

Table: `notification_deliveries`, as specified in [NOTIFICATIONS.md](../operations/NOTIFICATIONS.md) Part XLII: `id`, `notification_id`, `channel`, `provider`, `status` (`PENDING`, `SENT`, `ACCEPTED_BY_PROVIDER`, `FAILED_TEMPORARY`, `FAILED_PERMANENT`, `SUPPRESSED`), `attempt_count`, `last_attempt_at`, `provider_reference`, `error_code`, `created_at`, `updated_at`.

## 161.5 NOTIFICATION PREFERENCE EXTENSIONS

Add to `user_notification_preferences` (§25):

- `quiet_hours_enabled` BOOLEAN;
- `quiet_hours_start` TIME;
- `quiet_hours_end` TIME;
- `timezone` VARCHAR (IANA);
- `message_preview_enabled` BOOLEAN, default false.

Marketing (`marketing_enabled`) defaults to false and requires affirmative consent (R-22).

## 161.6 CANONICAL STATES

- `connection_requests.status`: `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `CANCELLED`, `INVALIDATED`. A block sets `INVALIDATED` with `invalidation_reason = BLOCK`; there is no `BLOCKED` request state.
- `event_rsvps.status`: `GOING`, `WAITLISTED`, `CANCELLED`. "Not going" is the absence of an active RSVP.

---

# NEXT APPROVED ARTIFACT

With the data model now defined, the next correct artifact is the:

## **V1 Role & Permission Matrix + Authorization Specification**

That document should precisely define:

- Consumer User
- Verified User
- Premium User
- Organizer
- Moderator
- Event Manager
- Super Admin
- System/Service identities

and for every protected capability:

- Read
- Create
- Update
- Delete
- Approve
- Moderate
- Suspend
- View PII
- View reports
- View messages/evidence
- Manage billing
- Manage feature flags

Most importantly, it should define **resource-level authorization**, not merely UI roles, so we prevent IDOR and privilege escalation before technical architecture begins.