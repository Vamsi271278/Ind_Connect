# V1 NOTIFICATION & COMMUNICATION MATRIX

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
- Push Notification Infrastructure
- Transactional SMS where required
- Transactional Email where required

## Status
Approved downstream artifact based on:
- Product Requirements Document
- Screen-by-Screen UX + Functional Specification
- Business Rules Catalog
- Data Model + Data Dictionary
- Role & Permission Matrix
- Trust & Safety Operating Specification

---

# 1. PURPOSE

This document defines every user-facing communication behavior for V1.

It governs:

- push notifications;
- in-app notifications;
- transactional SMS;
- transactional email;
- security/account alerts;
- moderation communications;
- event reminders;
- subscription notices;
- notification preferences;
- deep links;
- retries;
- deduplication;
- quiet hours;
- rate limiting;
- localization;
- privacy;
- observability;
- analytics.

No product team, mobile team, backend team, or Claude Code agent should invent new notification behavior outside this specification without product approval.

---

# 2. COMMUNICATION PRINCIPLES

## 2.1 Notifications Must Be Useful

Every notification must answer at least one of:

- Did something happen that requires attention?
- Did something change that affects the user?
- Is there a time-sensitive action?
- Is there a safety/security concern?
- Is there a meaningful event reminder?

Do not send notifications merely to increase app opens.

---

## 2.2 Privacy Before Engagement

Never reveal sensitive information on a lock screen unnecessarily.

Examples to avoid:

- exact dating preference;
- report details;
- suspension reason beyond safe category;
- private message content if user has chosen hidden previews;
- another user's exact location.

---

## 2.3 No Explicit Rejection Pushes

Do not send:

> "Ananya declined your connection request."

Declines are intentionally privacy-preserving.

---

## 2.4 Safety Notifications Override Marketing Preferences

Critical account/safety/security notices may be delivered even when promotional notifications are disabled, where appropriate.

---

## 2.5 Respect User Preferences

Non-critical notifications must honor user-configured preferences.

---

## 2.6 Avoid Notification Flooding

The system must aggregate, deduplicate, and rate-limit repetitive events.

---

# 3. COMMUNICATION CHANNELS

V1 channels:

```text
PUSH
IN_APP
SMS_TRANSACTIONAL
EMAIL_TRANSACTIONAL
ADMIN_INTERNAL_ALERT
```

Not every event uses every channel.

---

# 4. CHANNEL USAGE RULES

## PUSH

Use for:

- connection request;
- accepted request;
- new message;
- event reminder;
- event cancellation;
- urgent account/safety alert.

## IN-APP

Use for nearly all user-visible transactional events.

Acts as persistent notification history.

## SMS_TRANSACTIONAL

Use primarily for:

- OTP;
- critical account recovery if approved.

Avoid social notifications by SMS in V1.

## EMAIL_TRANSACTIONAL

Use for:
- security/account changes;
- subscription receipt/status if applicable;
- moderation enforcement;
- appeal result;
- deletion confirmation;
- event changes only if user has opted into email communications in future.

## ADMIN_INTERNAL_ALERT

Use for:
- S4 safety escalation;
- incident escalation;
- critical moderation queue condition;
- billing webhook failures at operational level.

---

# 5. NOTIFICATION PREFERENCE CATEGORIES

User-facing preferences:

```text
CONNECTIONS
MESSAGES
EVENTS
COMMUNITY_UPDATES
PRODUCT_UPDATES
MARKETING
```

Security/account-critical notifications are system-controlled and not fully opt-out.

---

# 6. DELIVERY PRIORITY LEVELS

```text
P0 — Critical
P1 — High
P2 — Normal
P3 — Low
```

## P0
Security/safety/emergency account events.

## P1
Event cancellation, serious moderation change, accepted connection.

## P2
New message, event reminder, standard connection request.

## P3
Community/product/marketing updates.

---

# 7. QUIET HOURS

Recommended default:

No non-critical push between:

**10:00 PM – 8:00 AM user local time**

unless:
- user explicitly disables quiet hours;
- event reminder timing requires it and event timing justifies it;
- P0/P1 critical notification.

Messages received during quiet hours:
- in-app notification stored immediately;
- push may be suppressed or delayed based on user preference.

---

# 8. USER TIMEZONE

Primary timezone source:

1. current device timezone;
2. last known account timezone;
3. metro timezone fallback.

For DFW:

`America/Chicago`

Do not use fixed CST because daylight saving applies.

---

# 9. LOCK-SCREEN PRIVACY

Push payload should use generic copy for sensitive cases.

Example:

Good:
**You have a new message**

Avoid:
**Raj: "Meet me at your apartment..."**

Message previews may be configurable.

Default V1 recommendation:
include sender first name but not full message text.

---

# 10. PUSH TOKEN LIFECYCLE

Store per device:

- user ID;
- platform;
- token;
- app version;
- enabled;
- last_seen_at.

On invalid token response:
disable token.

Do not repeatedly retry permanently invalid device tokens.

---

# 11. NOTIFICATION DATA MODEL

Each notification should include:

```text
notification_id
user_id
type_code
priority
title
body
entity_type
entity_id
deep_link
created_at
read_at
expires_at
dedupe_key
```

---

# 12. DEDUPLICATION

Every trigger requiring dedupe should generate a deterministic key.

Example:

```text
connection_request:{request_id}
event_cancelled:{event_id}:{user_id}
message_push:{conversation_id}:{aggregation_window}
```

---

# 13. RETRY POLICY

Push delivery is best-effort.

Recommended:

- transient provider error → retry with exponential backoff;
- permanent invalid token → disable token;
- duplicate provider response → do not duplicate user notification.

In-app notification should be committed independently of push success.

---

# 14. DELIVERY ORDER

Preferred flow:

```text
Domain Event
↓
Create In-App Notification
↓
Evaluate User Preference
↓
Evaluate Quiet Hours
↓
Prepare Push
↓
Send Push
↓
Record Delivery Result
```

---

# 15. OUTBOX REQUIREMENT

Notification triggers should originate from reliable domain/outbox events where applicable.

Do not tightly couple transactional DB commits to external push provider availability.

---

# PART I — AUTHENTICATION COMMUNICATIONS

# N-AUTH-001 — OTP CODE

## Trigger
User requests OTP.

## Channel
SMS_TRANSACTIONAL

## Priority
P1

## Example
`Your Project Connect verification code is 482913. It expires in 5 minutes.`

## Rules
- do not include unnecessary account information;
- never log plaintext code;
- code expires;
- resend rate-limited.

## Deep Link
None required.

## Analytics
- otp_sms_requested
- otp_sms_provider_success
- otp_sms_provider_failure

---

# N-AUTH-002 — NEW SIGN-IN SECURITY ALERT

## Trigger
Optional V1/P1 if suspicious/new-device sign-in detection exists.

## Channels
EMAIL_TRANSACTIONAL
IN_APP

## Priority
P1

## Copy
**New sign-in detected**

A new sign-in to your Project Connect account was detected.

Include:
- approximate time;
- device/platform;
- approximate region if safe.

CTA:
**Secure My Account**

## Privacy
Do not expose IP address directly.

---

# N-AUTH-003 — PHONE NUMBER CHANGED

Future if supported.

## Channels
IN_APP
EMAIL_TRANSACTIONAL

## Priority
P0/P1

Should notify old trusted channel where feasible.

---

# PART II — CONNECTION NOTIFICATIONS

# N-CONN-001 — NEW CONNECTION REQUEST

## Trigger
`CONNECTION_REQUESTED`

## Recipient
Request recipient.

## Conditions
- request still PENDING;
- recipient ACTIVE;
- no block;
- CONNECTIONS notifications enabled.

## Channels
IN_APP
PUSH

## Priority
P2

## Push Title
**New connection request**

## Push Body
`Ananya wants to connect for Friendship.`

If privacy needs more generic wording:
`You have a new connection request.`

## In-App Detail
Show:
- first name;
- reason;
- shared interests if relevant.

## Deep Link
`app://connections/requests/{requestId}`

## Dedupe
request ID.

## Analytics
- connection_request_notification_created
- connection_request_push_sent
- connection_request_notification_opened

---

# N-CONN-002 — CONNECTION REQUEST ACCEPTED

## Trigger
`CONNECTION_ACCEPTED`

## Recipient
Original sender.

## Channels
IN_APP
PUSH

## Priority
P1

## Push Title
**You're connected**

## Push Body
`Ananya accepted your connection request.`

## CTA Deep Link
Conversation or connection profile.

Recommended:
`app://conversations/{conversationId}`

## Analytics
- connection_accepted_notification_opened

---

# N-CONN-003 — CONNECTION REQUEST DECLINED

## Trigger
Decline.

## Notification
**None**

No push.
No in-app rejection notice.

Sender-facing pending state may simply disappear or expire.

This is intentional privacy behavior.

---

# N-CONN-004 — CONNECTION REQUEST EXPIRED

## Default V1
No push.

Optional in-app passive state:
`Request expired`

Do not create unnecessary emotional friction.

---

# N-CONN-005 — REQUEST LIMIT WARNING

## Trigger
User has nearly reached daily limit.

## Recommended V1
Inline UI only.

No push.

Avoid conversion-pressure spam.

---

# PART III — MESSAGE NOTIFICATIONS

# N-MSG-001 — NEW MESSAGE

## Trigger
`MESSAGE_SENT`

## Recipient
Other conversation participant.

## Preconditions
- conversation ACTIVE;
- no block;
- recipient notifications enabled;
- recipient not currently active in same conversation, if presence reliable.

## Channels
IN_APP
PUSH

## Priority
P2

## Push Title
Sender first name.

## Push Body Default
**Sent you a message**

Do not include body by default.

Optional future privacy setting:
message preview on/off.

## Deep Link
`app://conversations/{conversationId}`

## Aggregation
If multiple messages from same conversation within short window:
collapse.

Example:

`3 new messages from Ananya`

## Dedupe
conversation + aggregation window.

---

# N-MSG-002 — MESSAGE DELIVERY FAILURE

## Trigger
Client message not accepted/server failed.

## Channel
Inline UI only.

No push to sender.

Display:
**Message not sent. Tap to retry.**

---

# N-MSG-003 — MUTED CONVERSATION

If recipient muted conversation:
- in-app unread count still updates;
- push suppressed.

---

# N-MSG-004 — BLOCKED CONVERSATION

No future message notifications.

Any queued unsent notification must be suppressed if block exists before dispatch.

---

# PART IV — EVENT NOTIFICATIONS

# N-EVT-001 — RSVP CONFIRMED

## Trigger
RSVP GOING.

## Channels
IN_APP

Push:
optional, generally unnecessary.

## Copy
**You're going**

`You're confirmed for Telugu Coffee Meetup on Saturday.`

## Deep Link
event detail.

---

# N-EVT-002 — EVENT REMINDER 24 HOURS

## Trigger
Scheduled job.

## Recipient
GOING users.

## Conditions
- event still PUBLISHED/FULL;
- user RSVP active;
- EVENTS notifications enabled.

## Channels
PUSH
IN_APP

## Priority
P2

## Push Title
**Tomorrow: Telugu Coffee Meetup**

## Push Body
`Starts at 6:00 PM in Frisco.`

## Deep Link
event detail.

---

# N-EVT-003 — EVENT REMINDER 2 HOURS

## Trigger
Scheduled.

## Priority
P2

## Copy
**Starting soon**

`Telugu Coffee Meetup starts in 2 hours.`

## Rule
Do not send both reminders if user opted out.

---

# N-EVT-004 — EVENT TIME CHANGED

## Trigger
Published event date/time materially modified.

## Channels
IN_APP
PUSH

## Priority
P1

## Copy
**Event time changed**

`Telugu Coffee Meetup is now scheduled for 7:00 PM.`

## Requirement
Notify current RSVP users.

---

# N-EVT-005 — EVENT VENUE CHANGED

## Trigger
Venue changed after RSVPs exist.

## Priority
P1

## Push
**Event location changed**

Body:
`Check the updated venue for Telugu Coffee Meetup.`

Avoid exposing full address in lock-screen push if privacy concern.

---

# N-EVT-006 — EVENT CANCELLED

## Trigger
`EVENT_CANCELLED`

## Channels
IN_APP
PUSH

Email optional future.

## Priority
P1

## Push Title
**Event cancelled**

## Push Body
`Telugu Coffee Meetup has been cancelled.`

## Deep Link
event detail/cancellation details.

## Bypass Quiet Hours?
If event is imminent, yes.

---

# N-EVT-007 — WAITLIST PROMOTED

If waitlist enabled.

## Priority
P1

## Push
**You're in**

`A spot opened for Telugu Coffee Meetup.`

## CTA
View event.

Potential RSVP reconfirmation may be required by future policy.

---

# N-EVT-008 — EVENT COMPLETED / POST-EVENT CONNECTION

## Trigger
Event ends.

## Recommended timing
2–6 hours after end.

## Channel
IN_APP
PUSH optional.

## Copy
**Meet someone you'd like to reconnect with?**

`See people from today's event who are open to connecting.`

## Preconditions
- attendee discovery feature enabled;
- user attended/RSVP criteria;
- privacy policies pass.

## Priority
P3.

Respect EVENTS preference.

---

# PART V — VERIFICATION NOTIFICATIONS

# N-VER-001 — SELFIE VERIFICATION APPROVED

## Trigger
Verification VERIFIED.

## Channels
IN_APP
PUSH

## Priority
P2

## Title
**Profile verified**

## Body
`Your verified badge is now active.`

Deep link:
Verification/Profile.

---

# N-VER-002 — VERIFICATION REQUIRES RETRY

## Channels
IN_APP
PUSH optional.

## Title
**Please retry verification**

## Body
`We couldn't complete your verification. You can try again.`

Do not expose anti-fraud logic.

---

# N-VER-003 — VERIFICATION UNDER REVIEW

In-app only.

Avoid unnecessary push.

---

# PART VI — SAFETY / MODERATION COMMUNICATIONS

# N-SAFE-001 — REPORT RECEIVED

## Trigger
Report submitted.

## Recipient
Reporter.

## Channel
IN_APP confirmation.

Push not necessary.

## Copy
**Thanks for reporting this**

`Our safety team will review your report.`

CTA:
Block User if relevant.

---

# N-SAFE-002 — REPORT REVIEW COMPLETE / ACTION TAKEN

## Recipient
Reporter.

## Channels
IN_APP

Push optional for serious case.

## Copy
`We reviewed your report and took action consistent with our policies.`

Do not disclose exact enforcement unless policy permits.

---

# N-SAFE-003 — REPORT REVIEW COMPLETE / NO ACTION

## Recipient
Reporter.

## Channel
IN_APP.

## Copy
`We reviewed your report. Based on the information available, we did not take action at this time. You can still block this person.`

---

# N-SAFE-004 — WARNING ISSUED

## Recipient
Enforced user.

## Channels
IN_APP
EMAIL_TRANSACTIONAL recommended

## Priority
P1

## Title
**Important account notice**

## Body
`We identified behavior that doesn't follow our Community Guidelines.`

CTA:
Review Guidelines.

Detailed page may state policy category.

Never reveal reporter identity.

---

# N-SAFE-005 — FEATURE RESTRICTION

## Recipient
Affected user.

## Channels
IN_APP
EMAIL_TRANSACTIONAL

## Priority
P1

## Title
**Some account features are temporarily limited**

Body:
state:
- what broad feature is unavailable;
- duration if known;
- appeal path if eligible.

---

# N-SAFE-006 — TEMPORARY SUSPENSION

## Channels
IN_APP restricted screen
EMAIL_TRANSACTIONAL

## Priority
P0/P1

## Copy
**Your account is temporarily suspended**

Include:
- duration;
- broad policy category;
- appeal option.

---

# N-SAFE-007 — PERMANENT BAN

## Channels
IN_APP restricted screen
EMAIL_TRANSACTIONAL

## Priority
P0/P1

## Copy
**Your account has been restricted**

Avoid adversarial wording.

Provide appeal route if eligible.

---

# N-SAFE-008 — APPEAL RECEIVED

## Channel
EMAIL_TRANSACTIONAL
IN_APP

## Copy
**We received your appeal**

`We'll review the information you provided.`

No unrealistic turnaround promise beyond approved SLA.

---

# N-SAFE-009 — APPEAL UPHELD

## Copy
**Appeal decision**

`After review, the original account action remains in place.`

Include next steps if any.

---

# N-SAFE-010 — APPEAL OVERTURNED

## Copy
**Your account access has been restored**

Explain restored capabilities.

---

# N-SAFE-011 — CRITICAL SAFETY COMMUNICATION TO REPORTER

Only when necessary.

Potential copy:
`We reviewed your safety report. If you believe you are in immediate danger, contact local emergency services.`

Do not imply Project Connect provides emergency-response capability.

---

# PART VII — ACCOUNT COMMUNICATIONS

# N-ACC-001 — ACCOUNT DEACTIVATED

## Channels
IN_APP confirmation
EMAIL_TRANSACTIONAL

## Copy
**Your account is deactivated**

`Your profile is hidden. Sign in again if you want to reactivate.`

---

# N-ACC-002 — ACCOUNT REACTIVATED

## In-app only.

`Welcome back. Your account is active again.`

---

# N-ACC-003 — DELETION REQUEST RECEIVED

## Channels
EMAIL_TRANSACTIONAL
IN_APP

## Priority
P1

## Copy
**Account deletion requested**

Explain:
- profile hidden;
- process underway;
- any grace/cancellation window if product supports one.

---

# N-ACC-004 — DELETION COMPLETED

## Channel
EMAIL_TRANSACTIONAL if email exists and policy allows.

## Copy
**Your Project Connect account has been deleted**

Keep minimal.

---

# N-ACC-005 — SECURITY SESSION REVOKED

Optional if security workflow exists.

## Priority
P0.

---

# PART VIII — SUBSCRIPTION COMMUNICATIONS

# N-SUB-001 — SUBSCRIPTION ACTIVATED

## Trigger
Entitlement ACTIVE.

## Channels
IN_APP

Email may be handled by Apple/Google; avoid duplicate unless useful.

## Copy
**Connect Plus is active**

`Your premium features are ready to use.`

---

# N-SUB-002 — PURCHASE RESTORED

In-app confirmation.

---

# N-SUB-003 — SUBSCRIPTION EXPIRING

Use only if provider/store rules and entitlement data reliably support it.

## Recommended
In-app only or email.

Do not send manipulative repeated reminders.

---

# N-SUB-004 — SUBSCRIPTION EXPIRED

## Channels
IN_APP

## Copy
**Connect Plus ended**

`Your account is still active. Premium features are no longer available.`

---

# N-SUB-005 — BILLING ISSUE

If provider communicates grace/past due.

## Priority
P1/P2

## Copy
**There may be an issue with your subscription**

CTA:
Manage Subscription.

Do not claim payment failure unless provider state confirms it.

---

# PART IX — PRODUCT / COMMUNITY COMMUNICATIONS

# N-PROD-001 — NEW FEATURE

## Channel
IN_APP
PUSH optional.

## Preference
PRODUCT_UPDATES.

## Priority
P3.

Use sparingly.

---

# N-COM-001 — LOCAL COMMUNITY UPDATE

Example:
New approved event category/community update.

## Preference
COMMUNITY_UPDATES.

## Priority
P3.

Do not send broad blasts too frequently.

---

# N-MKT-001 — MARKETING CAMPAIGN

## Channels
PUSH
EMAIL if separately consented.

## Preference
MARKETING.

## Priority
P3.

Must comply with:
- opt-out;
- consent;
- applicable messaging laws.

Not required for initial beta.

---

# PART X — NOTIFICATION MATRIX SUMMARY

| Event | In-App | Push | Email | SMS | Priority |
|---|---:|---:|---:|---:|---:|
| OTP | No | No | No | Yes | P1 |
| New Request | Yes | Yes | No | No | P2 |
| Request Accepted | Yes | Yes | No | No | P1 |
| Request Declined | No | No | No | No | — |
| New Message | Yes | Yes | No | No | P2 |
| RSVP Confirmed | Yes | Optional | No | No | P2 |
| Event 24h Reminder | Yes | Yes | No | No | P2 |
| Event 2h Reminder | Yes | Yes | No | No | P2 |
| Event Time Change | Yes | Yes | Optional | No | P1 |
| Event Cancelled | Yes | Yes | Optional | No | P1 |
| Verification Approved | Yes | Yes | No | No | P2 |
| Warning | Yes | Optional | Yes | No | P1 |
| Suspension | Yes | Optional | Yes | No | P0/P1 |
| Ban | Yes | Optional | Yes | No | P0/P1 |
| Appeal Result | Yes | Optional | Yes | No | P1 |
| Account Deletion | Yes | No | Yes | No | P1 |
| Subscription Activated | Yes | Optional | Optional | No | P2 |
| Billing Issue | Yes | Optional | Optional | No | P1 |
| Marketing | Optional | Optional | Optional | No | P3 |

---

# PART XI — DEEP LINK CONTRACT

Every actionable notification must use a safe internal route.

Examples:

```text
app://connections/requests/{id}
app://connections/{id}
app://conversations/{id}
app://events/{id}
app://profile/verification
app://account/restriction
app://subscription
app://notifications
```

---

# 16. DEEP LINK AUTHORIZATION

Opening a deep link must re-run backend authorization.

Never assume user is authorized because notification once existed.

Example:

User gets message notification.
Then sender blocks them.
User taps old notification.

App must handle safely.

---

# 17. DEEP LINK FALLBACK

If resource no longer exists/authorized:

Display:

**This item is no longer available.**

Avoid:
raw 404.

---

# PART XII — NOTIFICATION AGGREGATION

# 18. MESSAGE AGGREGATION

Within 5-minute window:

Instead of 8 pushes:
send one collapsed notification where platform supports.

Example:

`5 new messages from Ananya`

---

# 19. CONNECTION REQUEST AGGREGATION

If user gets many requests within short period:

Possible:
`You have 4 new connection requests`

But individual in-app items remain.

Use only after density justifies it.

---

# 20. EVENT REMINDER DEDUPE

Never send:
24h reminder twice because scheduler retried.

Use deterministic dedupe key.

---

# PART XIII — NOTIFICATION RATE LIMITS

# 21. GLOBAL NON-CRITICAL PUSH CAP

Recommended initial cap:

**10 non-message, non-critical pushes/day**

Messages may exceed based on actual user interaction.

This is configurable.

---

# 22. MARKETING CAP

Recommended:

No more than:
2 push marketing messages/week during beta.

Prefer fewer.

---

# 23. EVENT CAP

If multiple event updates occur rapidly, consolidate when possible.

---

# PART XIV — QUIET HOURS DETAIL

# 24. QUIET-HOUR SUPPRESSED ITEMS

Suppress/delay:
- marketing;
- product updates;
- community updates;
- routine message pushes if configured;
- event discovery.

Do not delay:
- imminent event cancellation;
- account security;
- critical safety.

---

# 25. USER CONTROL

Future setting may let user customize quiet hours.

V1 can use default if complexity must be reduced.

---

# PART XV — NOTIFICATION PREFERENCE MODEL

Recommended data model:

```text
connections_enabled
messages_enabled
events_enabled
community_updates_enabled
product_updates_enabled
marketing_enabled
message_preview_enabled
quiet_hours_enabled
quiet_hours_start
quiet_hours_end
```

Last three may be P1.

> **Amended 2026-10-04 — R-10:** approved preference fields also include `timezone` (IANA). Delivery attempts are recorded in `notification_deliveries` (see DATA-MODEL §161).

---

# PART XVI — CHANNEL PREFERENCE PRECEDENCE

For a given notification:

```text
Critical policy requirement
↓
User account state
↓
Notification category preference
↓
Mute state
↓
Quiet hours
↓
Device token availability
↓
Provider delivery
```

---

# PART XVII — CONVERSATION MUTE

Mute scope:
one conversation.

Mute affects:
push for that conversation.

Does not affect:
- in-app unread;
- safety notifications;
- account communications.

---

# PART XVIII — IN-APP NOTIFICATION CENTER

Each item should contain:

- icon/category;
- title;
- summary;
- timestamp;
- unread/read status.

Actions:
tap to open.

Optional:
mark all read.

---

# 26. IN-APP RETENTION

Recommended:
90 days visible to user.

Older transactional notifications may be archived/purged.

Security notices may follow separate retention.

---

# 27. EXPIRED RESOURCE NOTIFICATIONS

If notification points to deleted/expired entity:
tap routes to graceful unavailable state.

---

# PART XIX — NOTIFICATION COPY STANDARDS

# 28. TITLE LENGTH

Recommended:
<= 40 characters where practical.

# 29. BODY LENGTH

Recommended:
<= 120 characters for push.

# 30. Tone

Use:
- calm;
- direct;
- human;
- non-judgmental.

Avoid:
- manipulative urgency;
- excessive emojis;
- shame;
- romantic pressure.

---

# 31. DATING COPY

Avoid:
`Ananya is waiting for you ❤️🔥`

Prefer:
`You have a new dating connection request.`

Professional and respectful.

---

# PART XX — PRIVACY COPY RULES

# 32. NEVER INCLUDE IN PUSH

- exact coordinates;
- phone numbers;
- email;
- report evidence;
- moderator notes;
- DOB;
- detailed dating preferences;
- private financial information.

---

# 33. MESSAGE PREVIEWS

Default V1:
off for message body.

Show:
sender name + generic message notice.

Future setting can enable previews.

---

# PART XXI — LOCALIZATION

All notification copy must use localization keys.

Do not hard-code English strings directly into event handlers.

Example:

```text
notification.connection_request.title
notification.connection_request.body
```

---

# 34. V1 LANGUAGE

English may be launch UI language.

Architecture must support future localized notifications.

---

# 35. DYNAMIC CONTENT

Names and event titles inserted through safe template variables.

No user-supplied text should become notification title/body without sanitization.

---

# PART XXII — TEMPLATE GOVERNANCE

Store notification templates centrally.

Recommended fields:

```text
template_code
channel
locale
title_template
body_template
active
version
```

Could initially remain in application code with localization files, but ownership should be centralized.

---

# PART XXIII — ANALYTICS

Every notification lifecycle should support:

```text
notification_created
notification_push_attempted
notification_push_delivered_or_accepted
notification_push_failed
notification_opened
notification_dismissed_if available
notification_deep_link_completed
```

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-03:** event names are canonical in the Analytics Spec (Part XIV): `notification_created`, `notification_suppressed`, `push_attempted` (supersedes `notification_push_attempted`), `push_provider_accepted`, `notification_opened`, `notification_deep_link_completed`. The list above describes lifecycle intent only.

Do not overpromise true delivery where provider only confirms acceptance.

---

# 36. REQUIRED PROPERTIES

- notification_type;
- channel;
- priority;
- user pseudonymous ID;
- app version;
- platform;
- source event;
- quiet-hours suppressed boolean;
- preference suppressed boolean.

No PII.

---

# PART XXIV — DELIVERY OBSERVABILITY

Monitor:

- push provider error rate;
- invalid token rate;
- send latency;
- queue backlog;
- duplicate-rate;
- notification-open rate;
- notification suppression rate;
- deep-link failure rate.

---

# 37. ALERT THRESHOLDS

Operational alert if:
- push provider failure spikes;
- notification queue delayed materially;
- event-cancellation notifications not dispatching;
- security notices failing.

---

# PART XXV — FAILURE HANDLING

# 38. PUSH FAILURE

Do not roll back primary domain action.

Example:
connection accepted successfully even if push fails.

In-app notification remains.

---

# 39. EMAIL FAILURE

Log/retry if transactional and important.

Do not duplicate user action.

---

# 40. SMS OTP FAILURE

OTP request must return user-safe error.

Allow retry according to rate limits/provider failover strategy.

---

# PART XXVI — SECURITY COMMUNICATIONS

# 41. SECURITY NOTICES SHOULD NOT BE EASY TO SPOOF

In-app account notices are authoritative.

Emails should:
- avoid requesting password;
- avoid requesting OTP reply;
- avoid payment through arbitrary external link.

---

# 42. PHISHING-RESISTANT COPY

Example:

> Project Connect will never ask you to send your password or verification code by email or chat.

Could appear in security center.

---

# PART XXVII — MODERATION COMMUNICATION RULES

# 43. DO NOT REVEAL REPORTER

Never write:

`You were reported by Priya.`

---

# 44. DO NOT REVEAL DETECTION LOGIC

Avoid:

`Our AI detected the word...`

Use policy-level explanation.

---

# 45. APPEAL LINK

All eligible enforcement notices should deep-link directly to appeal flow.

---

# PART XXVIII — EVENT OPERATIONAL COMMUNICATIONS

# 46. MATERIAL CHANGE DEFINITION

Notify attendees when changed:
- date;
- start time materially;
- venue;
- cancellation;
- eligibility;
- major safety instruction.

Do not notify for:
- typo fix;
- cover image update;
- minor formatting.

---

# 47. EVENT CHANGE BATCHING

If organizer changes date, venue, and description within 2 minutes:
send one consolidated update.

---

# PART XXIX — SUBSCRIPTION COMMUNICATION GOVERNANCE

# 48. STORE VS APP RESPONSIBILITY

Apple/Google may send:
- purchase receipt;
- renewal;
- cancellation/payment notices.

Project Connect should avoid duplicate billing communications unless necessary.

---

# 49. ENTITLEMENT STATE COPY

Differentiate:

- active;
- grace period;
- expired;
- cancelled but active until date.

Do not say:
`Your subscription is cancelled`
if benefits remain active until renewal end without clarifying.

---

# PART XXX — ADMIN INTERNAL ALERTS

# 50. S4 TRUST & SAFETY ALERT

Channels:
- internal alerting system;
- pager/on-call if implemented.

Include:
- case ID;
- severity;
- category;
- created time.

Avoid sensitive evidence in alert payload.

---

# 51. MODERATION SLA BREACH ALERT

If critical queue exceeds threshold:
notify T&S operations lead.

---

# 52. BILLING INTEGRATION ALERT

If webhook processing failure rate exceeds threshold:
notify engineering/on-call.

---

# PART XXXI — NOTIFICATION TESTING

Every notification must test:

1. trigger condition;
2. preference enabled;
3. preference disabled;
4. quiet hours;
5. blocked state;
6. deleted resource;
7. deep link;
8. duplicate retry;
9. invalid push token;
10. localization fallback.

---

# 53. HIGH-RISK QA CASES

## QA-N-01
Connection request sent, then sender blocks recipient before notification worker runs.

Expected:
notification suppressed.

## QA-N-02
Event cancelled at 11:30 PM for event at 8:00 AM.

Expected:
critical event cancellation bypasses quiet hours.

## QA-N-03
Message sent while recipient has conversation muted.

Expected:
in-app unread yes; push no.

## QA-N-04
User loses premium after premium-related notification queued.

Deep link must re-check current entitlement.

## QA-N-05
User taps stale suspension appeal link after appeal already closed.

Expected:
current status shown safely.

---

# PART XXXII — DELIVERY IDEMPOTENCY

Notification processing must tolerate repeated domain events.

Example:
billing provider retries webhook 5 times.

Result:
one user-visible notification.

---

# PART XXXIII — SCHEDULER RULES

Scheduled notifications must use:
- unique job ID;
- idempotency;
- cancellation if source state changes.

Example:
user cancels event RSVP.
Pending 24h reminder must be cancelled/suppressed.

---

# PART XXXIV — NOTIFICATION EXPIRATION

Examples:

Connection request push:
expires when request no longer actionable.

Event reminder:
expires after event start.

Message notification:
does not need long TTL.

Security notice:
longer in-app retention.

---

# PART XXXV — BADGE COUNTS

App icon badge should represent unread actionable items.

Recommended:
messages + connection requests.

Do not include:
marketing notifications.

---

# PART XXXVI — EMAIL STANDARDS

Transactional email must contain:

- product identity;
- reason for email;
- clear CTA if needed;
- security note where appropriate;
- support link;
- legal footer.

Marketing email must include:
unsubscribe controls where applicable.

---

# PART XXXVII — SMS STANDARDS

V1 SMS should be primarily authentication.

Avoid:
- event marketing;
- dating notifications;
- connection notices.

SMS is higher intrusion and cost.

---

# PART XXXVIII — USER COMMUNICATION HISTORY

Do not build a giant omnichannel communications-history UI in V1.

Operational backend may retain send records.

In-app notification center is sufficient user-facing history.

---

# PART XXXIX — NOTIFICATION SERVICE ARCHITECTURE

Recommended conceptual structure:

```text
Domain Events
    ↓
Notification Orchestrator
    ↓
Preference Engine
    ↓
Privacy/Policy Check
    ↓
Template Renderer
    ↓
Channel Router
    ├── In-App
    ├── Push
    ├── Email
    └── SMS
```

---

# PART XL — NOTIFICATION POLICY SERVICE

Centralized logic should answer:

```text
shouldNotify(
    user,
    notificationType,
    context
)
```

Returns:

```text
channels
priority
suppressionReason
quietHourBehavior
templateCode
```

Do not spread notification logic across random controllers.

---

# PART XLI — DATA TABLES

Recommended:

```text
notifications
notification_deliveries
notification_preferences
push_devices
notification_templates
scheduled_notifications
```

`notification_templates` and `scheduled_notifications` may be simplified in V1 if architecture remains clean.

---

# PART XLII — NOTIFICATION_DELIVERIES

Fields:

```text
id
notification_id
channel
provider
status
attempt_count
last_attempt_at
provider_reference
error_code
created_at
updated_at
```

Status:

```text
PENDING
SENT
ACCEPTED_BY_PROVIDER
FAILED_TEMPORARY
FAILED_PERMANENT
SUPPRESSED
```

---

# PART XLIII — SUPPRESSION REASON CODES

```text
USER_PREFERENCE_DISABLED
QUIET_HOURS
CONVERSATION_MUTED
BLOCK_RELATIONSHIP
RESOURCE_NO_LONGER_VALID
INVALID_DEVICE_TOKEN
ACCOUNT_NOT_ACTIVE
DUPLICATE
RATE_LIMIT
POLICY_SUPPRESSED
```

---

# PART XLIV — FEATURE FLAGS

Notification types should be capable of server-side disabling where needed.

Especially:
- post-event connections;
- product updates;
- marketing;
- new experimental social notifications.

---

# PART XLV — COMMUNICATION RELEASE GATE

Before launch verify:

- push permission flow;
- device-token lifecycle;
- connection notifications;
- message notifications;
- event cancellation notification;
- event reminders;
- safety/account communications;
- deep-link authorization;
- preferences;
- quiet-hours behavior;
- duplicate prevention;
- analytics;
- monitoring.

---

# PART XLVI — V1 COMMUNICATION DECISIONS FROZEN

1. OTP is sent via transactional SMS.
2. Connection request generates in-app + push.
3. Accepted connection generates in-app + push.
4. Decline generates no explicit notification.
5. Message body is not included in default push preview.
6. Muted conversation suppresses push.
7. Block suppresses future social notifications.
8. Event cancellations notify active RSVPs.
9. Non-critical notifications respect quiet hours.
10. Safety/account-critical notices may override quiet hours.
11. Marketing requires affirmative consent and is fully opt-out/revocable *(amended 2026-10-04, [R-22](../architecture/SPEC-RECONCILIATION.md))*.
12. Safety notifications are not dependent on subscription.
13. Notification deep links always reauthorize.
14. Push failure never rolls back primary product action.
15. Notification retries must be idempotent.
16. No exact user location appears in notification payloads.
17. No reporter identity appears in moderation notices.
18. Event-change notifications fire only for material changes.
19. In-app notifications remain the canonical user notification history.
20. Push is treated as best-effort delivery, not the system of record.

---

# PART XLVII — CLAUDE CODE COMMUNICATION RULES

Claude Code must not:

- invent push notifications for every new feature;
- send decline notifications;
- include private message content in push by default;
- expose location, phone, email, DOB, or report details;
- bypass notification preferences;
- send marketing under transactional categories;
- make domain transactions depend on push success;
- use user-supplied raw strings in notifications without sanitization;
- create deep links without server-side reauthorization;
- send duplicate notifications on retries;
- ignore quiet hours for normal communications.

Any new communication requires:

1. trigger;
2. recipient;
3. channel;
4. priority;
5. preference category;
6. quiet-hours behavior;
7. template;
8. deep link;
9. dedupe key;
10. analytics event;
11. privacy review.

---

# PART XLVIII — DEFINITION OF COMMUNICATION COMPLETE

A notification feature is complete only when:

- trigger is deterministic;
- recipient is correct;
- policy check exists;
- preferences honored;
- quiet hours handled;
- template approved;
- deep link authorized;
- dedupe implemented;
- retry behavior implemented;
- observability implemented;
- analytics implemented;
- QA tests pass.

---

# PART XLIX — FINAL COMMUNICATION POSITION

Project Connect notifications should reinforce the product's personality:

> **intentional, respectful, timely, safe, and useful.**

The notification system is not an engagement-spam engine.

It exists to:

- complete connection workflows;
- keep conversations reliable;
- protect event attendance;
- communicate safety/account actions;
- surface time-sensitive information.

The core rule is:

> **Send the least amount of communication necessary to keep the user's relationships, events, account, and safety state understandable.**

---

# NEXT ARTIFACT

The next artifact should be:

## **V1 Analytics Tracking Specification + KPI Measurement Framework**

It should define:

- canonical event taxonomy;
- event names;
- required properties;
- user/session identity rules;
- activation logic;
- meaningful connection calculation;
- acquisition attribution;
- retention cohorts;
- discovery funnel;
- connection funnel;
- message funnel;
- event funnel;
- dating funnel;
- subscription funnel;
- trust & safety funnel;
- north-star metrics;
- dashboards;
- experiment instrumentation;
- data quality controls;
- privacy exclusions;
- executive KPI definitions.

After that, the correct sequence is:

1. Design System Specification
2. Technical/System Architecture
3. Architecture Decision Records
4. Claude Code Engineering Constitution
5. Implementation Backlog / Epics / Stories