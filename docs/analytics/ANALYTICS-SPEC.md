# V1 ANALYTICS TRACKING SPECIFICATION + KPI MEASUREMENT FRAMEWORK

## Product
**Project Connect**

## Version
**V1.0**

## Product Category
Verified Indian-diaspora social, community, event, and dating platform

## Initial Market
Dallas–Fort Worth, Texas

## Platforms
- iOS
- Android
- Admin Web Console
- Backend Services
- Analytics Pipeline

## Status
Approved downstream artifact based on:
- Product Requirements Document
- Screen-by-Screen UX + Functional Specification
- Business Rules Catalog
- Data Model + Data Dictionary
- Role & Permission Matrix
- Trust & Safety Operating Specification
- Notification & Communication Matrix

---

# 1. PURPOSE

This document defines how Project Connect measures:

- acquisition;
- onboarding;
- activation;
- discovery;
- connections;
- messaging;
- meaningful connections;
- events;
- dating;
- retention;
- subscriptions;
- monetization;
- trust & safety;
- operational health;
- experimentation.

It establishes one canonical vocabulary so Product, Engineering, Growth, Finance, Trust & Safety, and leadership do not calculate the same metric differently.

---

# 2. ANALYTICS PRINCIPLES

## 2.1 Measure User Value, Not Just Activity

The product must not optimize primarily for:

- screen time;
- swipes;
- raw message count;
- push opens.

Primary measurement should emphasize:

- successful discovery;
- accepted connections;
- reciprocal conversations;
- event participation;
- retention;
- safe interaction.

---

## 2.2 One Metric = One Definition

Every executive KPI must have:

- exact formula;
- inclusion criteria;
- exclusion criteria;
- time window;
- data source;
- owner.

No dashboard may redefine it independently.

---

## 2.3 Event Names Are Contracts

Production event names must not be changed casually.

If semantics change materially:
- create new event/version;
- document migration.

---

## 2.4 Privacy First

Analytics must never capture:

- message bodies;
- OTP codes;
- authentication tokens;
- phone numbers;
- emails;
- exact GPS coordinates;
- moderation evidence;
- selfie/biometric data.

---

## 2.5 Server Events for Critical Business State

Important outcomes should come from backend truth where possible.

Examples:
- connection accepted;
- subscription activated;
- event RSVP created;
- account suspended.

Do not rely only on client taps.

---

# 3. ANALYTICS ARCHITECTURE

Recommended flow:

```text
Mobile / Web / Backend
        ↓
Analytics SDK / Event API
        ↓
Validation Layer
        ↓
Event Stream
        ↓
Warehouse
        ↓
Product Analytics + BI
```

Critical transactional events should also be derivable from database state.

---

# 4. EVENT ENVELOPE

Every event should include, where applicable:

- `event_id`
- `event_name`
- `event_version`
- `occurred_at`
- `user_id_pseudonymous`
- `anonymous_id`
- `session_id`
- `platform`
- `app_version`
- `os_version`
- `device_type`
- `metro_code`
- `city_code` if approved
- `source_screen`
- `screen_id`
- `experiment_assignments`
- `feature_flag_context`

Never include raw PII.

---

# 5. USER IDENTITY MODEL

Before signup:
use `anonymous_id`.

After verified account creation:
associate anonymous activity to pseudonymous internal user analytics ID.

Do not use:
- phone;
- email;
- name

as analytics identity.

---

# 6. SESSION DEFINITION

Recommended mobile session:

A new session begins when:
- app becomes active after 30+ minutes inactivity;
- user authenticates into a new account context.

Track:
- `session_started`
- `session_ended` where reliably available.

---

# 7. EVENT NAMING STANDARD

Use:

`object_action`

Examples:

- `signup_started`
- `profile_opened`
- `connection_sent`
- `message_sent`
- `event_rsvp_created`

Avoid vague names:

- `clicked_button`
- `activity`
- `event1`

---

# 8. COMMON PROPERTY STANDARDS

Use stable IDs/codes.

Good:
`intent_code = FRIENDSHIP`

Avoid:
`intent = "Friends"`

Use booleans explicitly:
`is_verified = true`

---

# PART I — ACQUISITION

# 9. acquisition_source

Canonical categories:

```text
ORGANIC
USER_REFERRAL
ORGANIZER_REFERRAL
EVENT_QR
WHATSAPP_COMMUNITY
TELEGRAM_COMMUNITY
FACEBOOK_COMMUNITY
INSTAGRAM
COMMUNITY_ASSOCIATION
PAID_SOCIAL
PAID_SEARCH
OTHER
UNKNOWN
```

---

# 10. EVENT — app_installed

Where measurable through attribution provider.

Properties:
- acquisition_source
- campaign_id
- ad_group_id where applicable
- metro_target

---

# 11. EVENT — first_app_open

First-ever app open on device/install.

---

# 12. EVENT — referral_link_opened

Properties:
- referral_type
- inviter pseudonymous ID
- campaign_code
- event_id if event invite

---

# 13. ACQUISITION KPIs

## Install-to-Signup Start Rate

`signup_started users / first_app_open users`

## Signup Completion Rate

`signup_completed / signup_started`

## Cost Per Activated User

`acquisition spend / activated users`

Only for paid campaigns.

---

# PART II — AUTHENTICATION & ONBOARDING

# 14. signup_started

Triggered when user begins registration.

---

# 15. age_gate_completed

Properties:
- eligible = true/false

Do not send DOB.

---

# 16. otp_requested

Properties:
- country_code
- attempt_number

No phone.

---

# 17. otp_verified

Backend-confirmed.

---

# 18. onboarding_step_viewed

Properties:
- step_code

---

# 19. onboarding_step_completed

Properties:
- step_code
- duration_seconds

---

# 20. signup_completed

Triggered only once onboarding core requirements are satisfied.

Backend preferred.

---

# 21. ONBOARDING FUNNEL

```text
First Open
→ Signup Started
→ Phone Verified
→ Name
→ Location
→ Intent
→ Languages
→ Interests
→ Photo
→ Onboarding Complete
```

Track conversion and abandonment at every step.

---

# 22. ONBOARDING KPI — Median Completion Time

From:
`signup_started`

to:
`signup_completed`

---

# 23. ONBOARDING KPI — Photo Drop-Off

Users reaching photo step but not finishing onboarding within 24 hours.

Useful because photo requirement may create friction.

---

# PART III — PROFILE

# 24. profile_completed

Triggered when profile crosses required V1 minimum.

Properties:
- completion_percent
- photo_count
- interest_count
- language_count
- intent_count
- is_verified

---

# 25. profile_updated

Properties:
- fields_changed codes only

Do not send text values.

Example:
`["BIO","INTERESTS"]`

---

# 26. profile_photo_uploaded

Properties:
- photo_number
- moderation_result

---

# 27. verification_started

---

# 28. verification_completed

Properties:
- verification_type
- outcome

Do not expose provider-sensitive data.

---

# 29. PROFILE KPI — Verification Rate

`verified profiles / activated users`

---

# 30. PROFILE KPI — Average Completion

Mean and median profile completion among MAU.

---

# PART IV — ACTIVATION

# 31. CANONICAL ACTIVATION DEFINITION

A user is activated when all are true:

1. signup complete;
2. phone verified;
3. profile completeness >=70%;
4. >=1 intent;
5. >=3 interests;
6. discovery viewed;
7. user performs at least one of:
   - sends connection request;
   - RSVPs to event (`event_rsvp_created`).

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-09:** the PRD activation definition governs. Accepting an incoming connection request does **not** independently satisfy activation (removed from this list).

Activation timestamp is when final condition becomes true.

---

# 32. EVENT — user_activated

Server/analytics-derived.

Fire once per user.

---

# 33. ACTIVATION KPI

## Activation Rate

`activated users / signup_completed users`

Measure within:
- 24 hours;
- 7 days.

Primary:
7-day activation.

---

# PART V — DISCOVERY

# 34. discovery_viewed

Properties:
- mode
- active_filter_count
- result_count_bucket

Do not transmit target user list.

---

# 35. discovery_mode_changed

Properties:
- from_mode
- to_mode

---

# 36. discovery_filters_applied

Properties:
- filter_codes
- premium_filter_used boolean

Do not log sensitive preference values beyond approved coarse ranges.

---

# 37. profile_impression

Triggered when profile card meets visibility threshold.

Recommended:
>=50% visible for >=500ms.

Properties:
- target pseudonymous ID
- discovery_mode
- rank_position
- recommendation_reason_codes
- ranking_version

---

# 38. profile_opened

Properties:
- target pseudonymous ID
- source_module
- discovery_mode

---

# 39. DISCOVERY FUNNEL

```text
Discovery Viewed
→ Profile Impression
→ Profile Opened
→ Connection Started
→ Connection Sent
```

---

# 40. DISCOVERY KPI — Profile Open Rate

`unique profiles opened / valid profile impressions`

---

# 41. DISCOVERY KPI — Impression-to-Request Rate

`connection requests / eligible profile impressions`

---

# 42. DISCOVERY KPI — Unique Relevant Profiles Seen

Median unique eligible profiles viewed per active user/week.

This is a liquidity metric.

---

# PART VI — CONNECTION REQUESTS

# 43. connection_started

Client event when connect composer opens.

Properties:
- reason context
- source screen

---

# 44. connection_sent

Backend-confirmed.

Properties:
- reason_code
- sender_intent_context
- recipient_verified boolean
- shared_interest_count_bucket
- language_overlap boolean
- distance_bucket

No exact distance.

---

# 45. connection_received

Derived/backend event for recipient.

---

# 46. connection_accepted

Backend-confirmed.

Properties:
- request_age_hours
- reason_code

---

# 47. connection_declined

Backend-confirmed.

Internal analytics only.

Do not generate user notification.

---

# 48. connection_expired

Backend state event.

---

# 49. connection_cancelled

---

# 50. CONNECTION FUNNEL

```text
Request Sent
→ Request Viewed
→ Accepted
→ First Message Sent
→ Reply Received
→ Meaningful Connection
```

---

# 51. KPI — Request Acceptance Rate

`accepted requests / resolved requests`

Also calculate:

`accepted / total requests sent older than eligibility window`

Avoid counting fresh pending requests unfairly.

---

# 52. KPI — Time to Acceptance

Median hours from request sent to accepted.

---

# 53. KPI — Connection Request Quality

Composite diagnostic:

- acceptance rate;
- block rate;
- report rate;
- reciprocal message rate.

Evaluate by:
- reason_code;
- acquisition cohort;
- discovery mode.

---

# PART VII — MESSAGING

# 54. conversation_opened

Properties:
- conversation_id pseudonymous
- source
- unread_count_bucket

---

# 55. message_sent

Backend-confirmed.

Properties:
- message_type
- sequence_bucket
- conversation_age_days

Never message text.

---

# 56. message_received

Backend/system event.

---

# 57. message_delivery_failed

Properties:
- error_class

No raw infrastructure stack trace in analytics.

---

# 58. first_message_sent

Fire once per connection.

---

# 59. first_reply_received

Fire once when opposite participant replies after first message.

---

# 60. meaningful_connection_created

Canonical north-star event.

Conditions:

1. connection accepted;
2. Participant A sends >=1 message;
3. Participant B sends >=1 message;
4. both messages occur within 7 days of connection acceptance.

Count once per connection relationship.

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-08:** frozen formula. Messages must be persisted; the reciprocal exchange must occur within 7 days of acceptance; counted once. This definition is canonical across all documents.

---

# 61. sustained_conversation_created

Definition:

>=10 total messages across both participants within 7 days of acceptance.

Count once.

---

# 62. MESSAGING KPI — First Message Rate

`connections with message / accepted connections`

---

# 63. MESSAGING KPI — Reply Rate

`connections where recipient replied / connections with first message`

---

# 64. MESSAGING KPI — Sustained Conversation Rate

`sustained conversations / accepted connections`

---

# PART VIII — NORTH STAR

# 65. PRIMARY NORTH-STAR METRIC

## Weekly Meaningful Connections Created

Formula:

`count(meaningful_connection_created) per week`

### Normalized network-quality KPI — Meaningful Connections per WAU

`meaningful connections created in week / WAU`

This measures whether active users are actually forming reciprocal relationships.

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-08:** the North Star is **Weekly Meaningful Connections Created** (retaining the PRD intent). Meaningful Connections/WAU is the normalized health KPI. These are complementary, not competing, definitions. Frozen decision #2 in Part XXXV is read accordingly.

---

# 66. SECONDARY NORTH-STAR

## % of Activated Users Creating a Meaningful Connection Within 14 Days

This measures time-to-value.

---

# 67. SAFETY COUNTER-METRIC

Every connection metric must be viewed alongside:

## Blocks per 1,000 Connections

and

## Reports per 1,000 Connections

Growth that increases unsafe interaction is not success.

---

# PART IX — EVENTS

# 68. event_impression

Properties:
- event_id
- category
- source_module

---

# 69. event_opened

---

# 70. event_rsvp_started

---

# 71. event_rsvp_created

Backend-confirmed.

Properties:
- event_category
- days_before_event
- capacity_bucket
- source

---

# 72. event_rsvp_cancelled

---

# 73. event_waitlisted

---

# 74. event_waitlist_promoted

---

# 75. event_attendee_discovery_viewed

Only if feature enabled.

---

# 76. post_event_connection_sent

Connection request whose source is post-event discovery.

---

# 77. EVENT FUNNEL

```text
Event Impression
→ Event Open
→ RSVP
→ Attendance Proxy/Check-in if available
→ Post-Event Profile View
→ Post-Event Connection
→ Meaningful Connection
```

---

# 78. KPI — Event RSVP Conversion

`unique RSVP users / unique event detail viewers`

---

# 79. KPI — Event-to-Connection Rate

`post-event connections / attendee users`

---

# 80. KPI — Event-Generated Meaningful Connections

Meaningful connections whose source attribution originates from event attendee/post-event flow.

This may become a major business KPI.

---

# PART X — DATING

# 81. dating_enabled

Properties:
- source = onboarding/settings

---

# 82. dating_disabled

---

# 83. dating_discovery_viewed

---

# 84. dating_profile_opened

---

# 85. dating_connection_sent

Use connection event with dating context.

---

# 86. dating_connection_accepted

---

# 87. dating_meaningful_connection

Derived subset of meaningful connections created through dating context.

---

# 88. DATING KPIs

- Dating MAU
- Dating request acceptance rate
- Dating reply rate
- Dating meaningful connection rate
- Dating block rate
- Dating report rate
- Dating paid conversion

Never optimize dating purely for request volume.

---

# PART XI — RETENTION

# 89. ACTIVE USER DEFINITION

## DAU
Unique user with meaningful authenticated product activity that day.

Exclude:
- background refresh only;
- push delivery only;
- passive token refresh.

Include:
- discovery;
- profile interaction;
- messaging;
- event interaction;
- settings intentional actions.

---

# 90. WAU

Unique active users over rolling/calendar 7-day period.

---

# 91. MAU

Unique active users over 30-day period.

---

# 92. D1 RETENTION

User active on day after activation/signup cohort day.

Prefer activation-based retention for product value analysis.

---

# 93. D7 RETENTION

Active on day 7 ± defined standard window.

Pick one convention and never mix.

Recommended:
classic exact-day retention plus rolling retention dashboard.

---

# 94. D30 RETENTION

Same methodology.

---

# 95. COHORT SEGMENTS

Retention should be available by:

- acquisition source;
- metro;
- initial intent;
- dating enabled;
- verified/unverified;
- event participant;
- premium/free;
- new-to-city self-identification if added.

---

# 96. KPI — Connection Retention Lift

Compare D30 retention:

users with >=1 meaningful connection

vs

users without meaningful connection.

This measures whether product value drives retention.

---

# PART XII — SUBSCRIPTIONS

# 97. paywall_viewed

Properties:
- source
- entitlement_trigger
- plan_version

---

# 98. subscription_started

Provider-confirmed.

Properties:
- product_code
- plan_period
- price_bucket/currency if allowed
- acquisition_source

---

# 99. subscription_restored

---

# 100. subscription_cancelled

Provider-confirmed state.

Distinguish:
cancelled-but-still-active from expired.

---

# 101. subscription_expired

---

# 102. subscription_payment_issue

Provider-confirmed.

---

# 103. SUBSCRIPTION FUNNEL

```text
Premium Feature Encounter
→ Paywall Viewed
→ Purchase Started
→ Purchase Confirmed
→ Entitlement Active
→ Renewal
```

---

# 104. KPI — Free-to-Paid Conversion

`new paying users / eligible active free users`

Specify cohort/window.

Recommended:
30-day conversion after activation.

---

# 105. KPI — Paywall Conversion

`confirmed purchases / paywall viewers`

---

# 106. KPI — Subscriber Retention

Month-over-month active paid subscriptions.

---

# 107. KPI — ARPPU

Average Revenue Per Paying User.

Use finance-grade billing records, not client events.

---

# 108. KPI — MRR

Monthly recurring revenue from active recurring subscriptions.

Finance source of truth:
billing/subscription provider data.

---

# 109. MONETIZATION SEGMENTATION

Analyze conversion by:

- dating users;
- friendship-only;
- verification status;
- number of meaningful connections;
- acquisition source.

Do not use sensitive segmentation for unfair pricing.

---

# PART XIII — TRUST & SAFETY ANALYTICS

# 110. report_started

---

# 111. report_submitted

Properties:
- category_code
- source_type
- severity_initial
- user_mode context

Do not include report text.

---

# 112. user_blocked

Properties:
- source_context
- connection_state_at_block
- days_since_connection
- dating_context boolean

---

# 113. moderation_action_taken

Backend/internal.

Properties:
- action_code
- policy_category
- severity
- automated_vs_human

No evidence content.

---

# 114. appeal_submitted

---

# 115. appeal_resolved

Properties:
- outcome
- original_action
- review_duration_hours

---

# 116. SAFETY KPI — Reports per 1,000 MAU

`reports / MAU * 1000`

---

# 117. SAFETY KPI — Reports per 1,000 Connections

Better relational safety metric.

---

# 118. SAFETY KPI — Blocks per 1,000 Connections

---

# 119. SAFETY KPI — Confirmed Violation Rate

`reports with confirmed policy violation / reports reviewed`

Interpret carefully.

---

# 120. SAFETY KPI — Median Time to First Review

By severity.

---

# 121. SAFETY KPI — Appeal Overturn Rate

`overturned appeals / resolved appeals`

High rate may indicate moderation-quality issue.

---

# 122. SAFETY KPI — Repeat Offender Rate

Users receiving another confirmed enforcement within defined period after prior enforcement.

---

# PART XIV — NOTIFICATIONS

# 123. notification_created

Properties:
- type_code
- channel intended
- priority

---

# 124. notification_suppressed

Properties:
- suppression_reason

---

# 125. push_attempted

---

# 126. push_provider_accepted

Do not call this "delivered" unless provider truly confirms delivery.

---

# 127. notification_opened

---

# 128. notification_deep_link_completed

---

# 129. KPI — Notification Utility

Open rate by type.

But avoid optimizing safety/account notices for open-rate alone.

---

# PART XV — REFERRALS

# 130. invite_shared

Properties:
- channel
- context = app/event

---

# 131. referral_signup_completed

---

# 132. referral_user_activated

---

# 133. KPI — Referral Activation Rate

`referred users activated / referred signups`

---

# 134. KPI — Viral Coefficient

At later scale:

average invites/user × conversion rate.

Use cautiously; quality matters more than raw virality.

---

# PART XVI — EXECUTIVE KPI FRAMEWORK

# 135. EXECUTIVE DASHBOARD — GROWTH

Show:

- New Registrations
- Activated Users
- 7-Day Activation Rate
- WAU
- MAU
- D30 Retention
- Referral Share

---

# 136. EXECUTIVE DASHBOARD — LIQUIDITY

Show:

- Profiles Viewed/User
- Requests Sent/User
- Request Acceptance Rate
- Meaningful Connections/WAU
- Time to First Meaningful Connection
- % Activated Users with Meaningful Connection in 14 Days

---

# 137. EXECUTIVE DASHBOARD — EVENTS

Show:

- Event Detail Views
- RSVPs
- RSVP Conversion
- Active Events
- Event-Generated Connections
- Event-Generated Meaningful Connections

---

# 138. EXECUTIVE DASHBOARD — MONETIZATION

Show:

- Paid Subscribers
- Free-to-Paid Conversion
- MRR
- ARPPU
- Renewal Rate
- Premium Feature Usage

---

# 139. EXECUTIVE DASHBOARD — SAFETY

Show:

- Reports / 1,000 Connections
- Blocks / 1,000 Connections
- S3/S4 Reports
- Median Review Time
- Enforcement Rate
- Appeal Overturn Rate

---

# 140. EXECUTIVE HEALTH SCORE

Do not create one opaque overall score.

Instead use a balanced scorecard:

```text
Growth
Liquidity
Retention
Revenue
Safety
Reliability
```

---

# PART XVII — CORE FUNNELS

# 141. ACQUISITION FUNNEL

```text
Install
→ First Open
→ Signup Started
→ Phone Verified
→ Signup Complete
→ Activated
```

---

# 142. CONNECTION FUNNEL

```text
Discovery
→ Impression
→ Profile Open
→ Connection Send
→ Accepted
→ First Message
→ Reply
→ Meaningful Connection
```

---

# 143. EVENT FUNNEL

```text
Event Impression
→ Event Open
→ RSVP
→ Attendance Proxy
→ Post-Event Discovery
→ Connection
→ Meaningful Connection
```

---

# 144. SUBSCRIPTION FUNNEL

```text
Premium Trigger
→ Paywall
→ Purchase Start
→ Provider Confirmation
→ Entitlement
→ Renewal
```

---

# 145. SAFETY FUNNEL

```text
Unsafe Interaction
→ Block / Report
→ Review
→ Decision
→ Enforcement
→ Appeal
→ Final Outcome
```

---

# PART XVIII — TIME-TO-VALUE

# 146. KPI — Time to First Connection Request

From activation to first request sent/received.

---

# 147. KPI — Time to First Accepted Connection

---

# 148. KPI — Time to First Meaningful Connection

This should be a major executive metric.

Median and P75.

---

# 149. TARGET PHILOSOPHY

If median time-to-meaningful-connection is very long, the network may feel empty even if registrations are high.

---

# PART XIX — LOCAL MARKET LIQUIDITY

# 150. LIQUIDITY BY METRO

Track:

- MAU;
- eligible discoverable profiles;
- weekly requests;
- acceptance rate;
- meaningful connections;
- events;
- safety rate.

Expansion should depend on metro liquidity, not total app users.

---

# 151. ACTIVE PROFILE DENSITY

`discoverable active users / active metro`

Segment by:
- intent;
- age bands;
- dating cohort;
- language.

Use only aggregated reporting.

---

# 152. DISCOVERY EXHAUSTION RATE

% of active users hitting:
- no relevant profiles;
- repeated profile pool;
- expanded-radius prompt.

Important city expansion signal.

---

# PART XX — EXPERIMENTATION

# 153. EXPERIMENT EVENT REQUIREMENTS

Every experiment assignment must include:

- experiment_id;
- variant_id;
- assigned_at;
- eligibility criteria.

Assignment must be stable unless designed otherwise.

---

# 154. EXPERIMENT METRIC HIERARCHY

Every experiment needs:

## Primary metric
One intended outcome.

## Guardrails
Safety, retention, performance.

Example:
Increase connection request acceptance.

Guardrails:
- block rate;
- report rate;
- request spam rate.

---

# 155. NO SAFETY-DEGRADING WINS

If experiment increases:
- requests +20%

but also:
- harassment reports +50%

it is not a successful experiment.

---

# 156. EXPERIMENTS REQUIRING T&S REVIEW

- stranger-contact limits;
- dating visibility;
- location precision;
- verification changes;
- event attendee visibility;
- messaging looseness.

---

# PART XXI — DATA QUALITY

# 157. EVENT VALIDATION

Every event must pass schema validation.

Reject/quarantine malformed events.

---

# 158. REQUIRED DATA QUALITY CHECKS

Monitor:

- event volume anomalies;
- missing user IDs;
- duplicate event IDs;
- impossible timestamps;
- invalid enum values;
- sudden funnel discontinuity after release.

---

# 159. DUPLICATE EVENT HANDLING

Every event has unique `event_id`.

Backend events should support idempotency.

---

# 160. CLIENT CLOCK TRUST

Use server receive time for critical ordering where device clock may be wrong.

Preserve client event time separately if needed.

---

# 161. RELEASE VALIDATION

Every mobile release should include analytics smoke test for critical events:

- signup;
- discovery;
- connection;
- message;
- event RSVP;
- subscription;
- report.

---

# 162. ANALYTICS CONTRACT TESTS

Automated tests should validate:

- event name;
- required properties;
- prohibited PII absence;
- enum correctness.

---

# PART XXII — PRIVACY

# 163. PROHIBITED ANALYTICS PROPERTIES

Never send:

- first/last name;
- phone;
- email;
- DOB;
- exact coordinates;
- OTP;
- message text;
- report free text;
- moderator notes;
- verification images;
- raw payment details.

---

# 164. LOCATION ANALYTICS

Allowed:
- metro_code
- city_code if privacy-reviewed
- distance bucket

Not:
precise GPS.

---

# 165. AGE ANALYTICS

Use age bands.

Example:

```text
18_24
25_29
30_34
35_39
40_49
50_PLUS
```

Do not send DOB.

---

# 166. DATING ANALYTICS

Treat as sensitive.

Access to detailed dating dashboards should be role-limited.

Avoid exporting user-level dating preferences broadly.

---

# PART XXIII — DATA RETENTION

# 167. RAW ANALYTICS EVENTS

Retention should be defined by data/legal architecture.

Recommended principle:
retain detailed raw event data only as long as operationally useful.

Aggregated metrics may be retained longer.

---

# 168. USER DELETION

Analytics should support deletion/anonymization according to privacy obligations.

Prefer pseudonymous IDs that can be detached from identity.

---

# PART XXIV — DASHBOARD OWNERSHIP

# 169. PRODUCT DASHBOARD OWNER

Product Analytics.

# 170. SAFETY DASHBOARD OWNER

Trust & Safety Analytics.

# 171. REVENUE DASHBOARD OWNER

Finance/Product Growth.

# 172. EXECUTIVE DASHBOARD OWNER

Product/Business leadership with Data ownership.

No unmanaged duplicate dashboard definitions.

---

# PART XXV — KPI SOURCE OF TRUTH

# 173. USER COUNTS

Warehouse based on account/activity events.

# 174. SUBSCRIPTION REVENUE

Billing provider / reconciled finance data.

# 175. CONNECTION STATE

Transactional backend/database events.

# 176. SAFETY ENFORCEMENT

Trust & Safety system/database.

Do not estimate finance/safety metrics from mobile analytics alone.

---

# PART XXVI — V1 DASHBOARDS

# 177. Dashboard 1 — Acquisition & Activation

Widgets:
- installs
- signup starts
- signup completion
- activation
- acquisition source
- onboarding drop-off

---

# 178. Dashboard 2 — Discovery & Connections

Widgets:
- impressions
- profile opens
- requests
- acceptance
- first message
- replies
- meaningful connections

---

# 179. Dashboard 3 — Retention

Cohorts:
- activation week
- acquisition source
- intent
- event participation
- verified vs unverified

---

# 180. Dashboard 4 — Events

- active events
- event views
- RSVPs
- RSVP conversion
- post-event connections
- safety reports/event

---

# 181. Dashboard 5 — Dating

- dating opt-in
- dating MAU
- requests
- acceptance
- meaningful connections
- blocks/reports
- subscription conversion

Restricted access.

---

# 182. Dashboard 6 — Revenue

- subscribers
- MRR
- conversion
- renewal
- expiry
- premium usage

---

# 183. Dashboard 7 — Safety

- reports
- blocks
- violations
- severity
- SLA
- appeals
- repeat offenders

---

# 184. Dashboard 8 — Reliability

- app crashes
- API error rate
- push failures
- message latency
- login failures

---

# PART XXVII — LAUNCH SCORECARD

# 185. WEEKLY V1 SCORECARD

Every week leadership should review:

```text
Acquisition
Activation
MAU
D7/D30 retention
Meaningful connections
Request acceptance
Event RSVPs
Paid conversion
Reports/1,000 connections
Blocks/1,000 connections
Critical safety cases
Crash-free sessions
```

---

# 186. METRIC INTERPRETATION EXAMPLES

High registrations + low activation:
onboarding/value problem.

High activation + low profile impressions:
liquidity/discovery issue.

High requests + low acceptance:
matching quality or request-quality issue.

High accepted connections + low replies:
weak intent/context or spammy interactions.

High event RSVPs + low post-event connection:
event experience or attendee-discovery gap.

High dating growth + high block rate:
unsafe growth; do not celebrate.

---

# PART XXVIII — CITY EXPANSION GATE

A second metro should not launch based on registrations alone.

Review:

- local MAU;
- active discoverable profiles;
- discovery exhaustion;
- connection acceptance;
- meaningful connection rate;
- D30 retention;
- event density;
- safety rate.

---

# 187. INITIAL EXPANSION THRESHOLD FRAMEWORK

Illustrative, not final:

```text
1,000+ MAU
Healthy 30-day retention
Meaningful connection rate above agreed threshold
Low discovery exhaustion
Manageable safety rate
Recurring event activity
```

Final numerical gate established after DFW baseline.

---

# PART XXIX — METRIC VERSIONING

# 188. KPI Definition Registry

Maintain file/table with:

- metric_name;
- metric_version;
- definition;
- formula;
- owner;
- effective_date.

Example:
`meaningful_connection_v1`

If definition changes, do not silently rewrite history.

---

# PART XXX — ANALYTICS EVENT REGISTRY

Each event entry should define:

```text
Event Name
Version
Trigger
Emitter
Properties
Required/Optional
PII Classification
Downstream KPIs
Owner
```

This registry becomes implementation contract.

---

# PART XXXI — EXAMPLE EVENT CONTRACT

## `connection_sent`

Emitter:
Backend.

Trigger:
Connection request transaction committed.

Required properties:
- request_id pseudonymous
- reason_code
- source_context
- is_dating_context
- sender_verification_state
- recipient_verification_state
- shared_interest_count_bucket
- distance_bucket
- ranking_version

Forbidden:
- names
- intro message text
- phone
- exact distance if privacy policy disallows

---

# PART XXXII — CLAUDE CODE ANALYTICS RULES

Claude Code must not:

- invent event names ad hoc;
- log message/report text;
- log PII;
- fire business-success events from button taps when backend confirmation is required;
- double-fire events on retries;
- modify KPI definitions silently;
- use analytics as authorization logic;
- block primary user action because analytics provider failed.

Any new event requires:
1. event name;
2. trigger;
3. emitter;
4. properties;
5. privacy classification;
6. KPI use;
7. QA test.

---

# PART XXXIII — FAILURE ISOLATION

Analytics failure must never prevent:

- signup;
- connection;
- messaging;
- blocking;
- reporting;
- event RSVP;
- subscription activation.

Events may queue/retry asynchronously.

---

# PART XXXIV — DEFINITION OF ANALYTICS COMPLETE

A feature is analytics-complete when:

1. business outcome defined;
2. funnel events defined;
3. server/client emitter selected;
4. properties documented;
5. PII reviewed;
6. events validated;
7. dashboard query defined where needed;
8. QA confirms events;
9. metric owner assigned;
10. alert/data-quality check exists for critical events.

---

# PART XXXV — V1 ANALYTICS DECISIONS FROZEN

1. Meaningful Connection is the core product-value event.
2. Meaningful Connections/WAU is the primary north-star metric.
3. Safety metrics are mandatory guardrails.
4. Critical business state comes from backend truth.
5. Message content is never analytics data.
6. Exact location is never analytics data.
7. Declined requests may be measured internally but not notified to users.
8. Activation uses a fixed canonical definition.
9. Subscription revenue uses billing provider truth.
10. City expansion depends on local liquidity metrics.
11. Dating analytics is access-restricted.
12. Event-generated connections must be attributable.
13. Experiments require guardrails.
14. Analytics failure never blocks product functionality.
15. KPI definitions are versioned.

---

# PART XXXVI — FINAL MEASUREMENT POSITION

Project Connect should not ask:

> "How much time are people spending in the app?"

as its primary success question.

It should ask:

> **Are people discovering relevant people, forming reciprocal connections, returning because those connections are valuable, and doing so safely?**

The measurement hierarchy is:

```text
Acquisition
↓
Activation
↓
Discovery Liquidity
↓
Connection Acceptance
↓
Reciprocal Conversation
↓
Meaningful Connection
↓
Retention
↓
Revenue
```

with:

```text
Safety
Privacy
Reliability
```

as mandatory guardrails across every layer.

The executive product equation is:

> **Healthy Growth = More Meaningful Connections + Strong Retention + Sustainable Revenue − Harmful Interaction**

---

# NEXT ARTIFACT

The next artifact should be:

## **V1 Design System Specification**

It should define implementation-grade UX standards for:

- brand personality;
- color system;
- semantic color tokens;
- typography;
- spacing scale;
- grid;
- radius;
- elevation;
- iconography;
- photography/profile imagery;
- buttons;
- inputs;
- chips;
- cards;
- navigation;
- bottom sheets;
- modals;
- toasts;
- skeletons;
- empty/error states;
- profile cards;
- messaging;
- events;
- verification;
- safety surfaces;
- premium surfaces;
- light/dark mode;
- motion;
- haptics;
- responsive behavior;
- accessibility;
- design tokens;
- Figma/component naming;
- React Native component contracts.

After that we will finally be ready to move into **Technical/System Architecture** without forcing engineering to invent the visual system.