# V1 SCREEN-BY-SCREEN UX + FUNCTIONAL SPECIFICATION

## Product
**Project Connect**

## Version
**V1.0**

## Product Type
Verified Indian-diaspora connection platform

## Launch Market
Dallas–Fort Worth

## Platforms
- iOS
- Android
- Admin web console

## Status
Approved downstream artifact based on V1 PRD.

---

# 1. PURPOSE OF THIS DOCUMENT

This specification translates the approved V1 PRD into an implementation-ready screen model.

For each screen this document defines:

- screen purpose;
- entry conditions;
- UI hierarchy;
- data fields;
- control behavior;
- validation;
- enabled/disabled states;
- loading/error/empty states;
- navigation;
- backend interactions;
- analytics;
- security/privacy requirements;
- accessibility requirements;
- QA acceptance criteria.

Engineering must not infer missing product behavior without documented clarification.

---

# 2. UX PRINCIPLES

## 2.1 Primary Product Experience

The app must feel:

- trusted;
- calm;
- intentional;
- modern;
- premium;
- community-oriented;
- safe;
- human.

It must not feel like:

- a matrimonial portal;
- a spammy classifieds app;
- a teenage dating app;
- a generic social feed;
- a WhatsApp replacement.

---

# 3. CORE NAVIGATION

Authenticated bottom navigation:

1. Discover
2. Events
3. Connections
4. Messages
5. Profile

Primary navigation hierarchy:

```text
App
├── Authentication
├── Onboarding
└── Main App
    ├── Discover
    ├── Events
    ├── Connections
    ├── Messages
    └── Profile
```

Modal and secondary routes:

- profile detail;
- connect request;
- report;
- block;
- subscription;
- filters;
- verification;
- event detail;
- notification center;
- privacy settings;
- account controls.

---

# 4. GLOBAL UX RULES

## Buttons

Primary button:
- one dominant CTA per screen;
- full-width where appropriate;
- disabled until requirements satisfied.

Secondary button:
- lower visual emphasis.

Destructive button:
- explicit destructive styling;
- requires confirmation where action cannot be trivially reversed.

---

## Form Errors

Validation sequence:

1. immediate local validation where obvious;
2. backend validation after submit;
3. error placed next to relevant field;
4. preserve user input.

Do not display generic "Something went wrong" when actionable explanation is available.

---

## Loading

Use:

- skeleton states for content screens;
- inline spinner for button submissions;
- full-screen loader only for mandatory blocking operations.

---

## Empty States

Each empty state must include:

- explanation;
- next action;
- no dead ends.

---

## Network Failure

Global behavior:

- show connection status when relevant;
- preserve unsaved input;
- allow retry;
- never imply success before backend confirmation.

---

# SECTION A — LAUNCH AND AUTHENTICATION

---

# SCREEN A01 — SPLASH / APP INITIALIZATION

## Purpose

Initialize:

- authentication state;
- feature flags;
- remote configuration;
- minimum supported app version;
- maintenance state;
- current session.

## Visible UI

- centered app logo;
- subtle loading indicator.

No marketing content.

## Backend Actions

On launch:

1. load secure session token;
2. request `/app/bootstrap`;
3. retrieve:
   - feature flags;
   - maintenance state;
   - minimum app version;
   - account status;
   - subscription entitlement;
4. refresh session if needed.

## Navigation

If no session:
→ A02 Welcome

If authenticated but onboarding incomplete:
→ onboarding continuation screen

If authenticated and active:
→ D01 Discover

If suspended:
→ P20 Account Restricted

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-18:** corrected from P18 (which is Delete Account) to P20.

If mandatory update:
→ A01B Update Required

If maintenance:
→ A01C Maintenance

## Error

If bootstrap unavailable:

Message:

> We couldn't connect right now.

Actions:

- Retry
- Continue with limited cached experience, only if technically safe

## Analytics

- app_opened
- bootstrap_started
- bootstrap_completed
- bootstrap_failed

---

# SCREEN A01B — UPDATE REQUIRED

## Purpose

Prevent unsupported application versions from operating.

## UI

Title:
**Update required**

Body:
A newer version of the app is required to continue.

CTA:
**Update App**

## Rules

No bypass if version is hard-blocked.

Backend-driven minimum supported version.

---

# SCREEN A01C — MAINTENANCE

## UI

Title:
**We'll be back shortly**

Body:
We are making improvements. Please try again later.

CTA:
**Retry**

Optional status/support link.

---

# SCREEN A02 — WELCOME

## Purpose

Introduce product value and begin registration.

## UI Hierarchy

Logo

Hero statement:

**Find your people nearby.**

Supporting text:

Meet verified members of the Indian diaspora for friendship, activities, community, events, networking, and dating.

Primary CTA:
**Get Started**

Secondary CTA:
**I Already Have an Account**

Footer:
Terms | Privacy

## Navigation

Get Started:
→ A03 Age Confirmation

Existing Account:
→ A05 Sign In

## Analytics

- welcome_viewed
- signup_started
- login_started

---

# SCREEN A03 — AGE CONFIRMATION

## Purpose

Confirm user is eligible for 18+ platform.

## Fields

Date of birth.

Components:

- month;
- day;
- year.

## Validation

Required.

Rules:

- valid date;
- user must be at least 18;
- impossible dates rejected;
- future dates rejected.

## CTA

**Continue**

Disabled until valid.

## Under-18 Behavior

Show:

**You must be 18 or older to use Project Connect.**

Account creation does not continue.

Do not retain unnecessary underage personal information.

## Backend Action

May remain local until phone verification/account creation.

## Analytics

- age_gate_viewed
- age_gate_completed (property `eligible`)

> **Amended 2026-10-04 — R-03:** `age_gate_passed` / `age_gate_failed` are superseded by the canonical `age_gate_completed` + `eligible`. Do not emit both.

---

# SCREEN A04 — PHONE NUMBER

## Purpose

Establish mandatory verified phone identity.

## UI

Country selector.

Phone number input.

Default country based on locale only—not assumed permanently.

## Field

### Phone number
Type: tel

Validation:

- required;
- valid E.164-format phone after normalization;
- valid country code;
- basic malformed-number checks.

## CTA

**Send Code**

## Supporting Text

"Standard carrier messaging rates may apply."

## Backend

POST `/auth/otp/request`

Payload:

- phone;
- channel = sms;
- signup/session context.

## Abuse Controls

- request rate limit;
- device rate limit;
- IP rate limit;
- CAPTCHA/risk challenge if triggered.

## Errors

- invalid number;
- rate limit exceeded;
- temporary SMS provider failure;
- number blocked due to abuse.

## Navigation

Success:
→ A04B OTP Verification

---

# SCREEN A04B — OTP VERIFICATION

## Fields

6-digit numeric OTP.

Auto-focus.

Auto-advance.

OS autofill support.

## UI

Text:

> Enter the 6-digit code sent to +1 ••• ••• 1234

Actions:

- Verify
- Resend code
- Change number

## Validation

- exactly 6 digits;
- numeric only.

## Resend

Disabled countdown:

Example:
`Resend in 00:30`

## Backend

POST `/auth/otp/verify`

## Success

If new user:
create provisional account.

Navigate:
→ O01 Name

If existing account:
→ bootstrap and main app/onboarding continuation.

## Errors

- incorrect code;
- expired code;
- too many attempts;
- server unavailable.

## Analytics

- otp_viewed
- otp_verified
- otp_failed
- otp_resent

---

# SCREEN A05 — SIGN IN

V1 sign-in primarily uses phone OTP.

## UI

Phone entry.

CTA:
**Continue**

Optional buttons if enabled:

- Continue with Apple
- Continue with Google

## Important

Even federated login may require phone verification if account lacks verified phone.

## Backend

Auth flow accordingly.

---

# SECTION B — ONBOARDING

---

# SCREEN O01 — NAME

## Purpose

Collect public display identity.

## Fields

### First Name
Required.

Max:
50 characters.

Allowed:
letters, spaces, apostrophes, hyphens.

### Last Name
Optional for V1.

Visibility:
private unless future requirements say otherwise.

## UX Recommendation

Public profile primarily shows first name.

## Validation

- no emojis-only names;
- no URLs;
- no phone numbers;
- obvious offensive/spam text flagged.

## CTA

**Continue**

## Backend

PATCH `/users/me/profile`

---

# SCREEN O02 — GENDER

## Purpose

Support user identity and dating compatibility.

## Options

Recommended:

- Woman
- Man
- Non-binary
- Prefer to self-describe
- Prefer not to say

Self-describe opens text field.

## Functional Rule

Dating mode may later require additional preference settings.

## Privacy

Gender visibility rules configurable.

Do not expose private selection in contexts where not needed.

---

# SCREEN O03 — LOCATION SETUP

## Purpose

Establish current metro and nearby-discovery context.

## UI

Title:
**Where are you based?**

Primary:
**Use My Location**

Secondary:
**Choose City Manually**

## If Permission Granted

OS location request.

Resolve city/metro.

Confirmation card:

Frisco, Texas  
Dallas–Fort Worth Metro

CTA:
**Use This Location**

## Manual Search

Search input.

Autocomplete supported cities.

Initial V1 should strongly support DFW municipalities.

## Public Display

City, not exact location.

## Backend

PATCH:

- city_id;
- metro_id;
- geolocation optional;
- location_source;
- timestamp.

## Privacy

Precise coordinate stored only if necessary and protected.

---

# SCREEN O04 — CONNECTION INTENT

## Purpose

Capture why user is using the platform.

## UI

Multi-select cards:

- Friendship
- Activities
- Professional Networking
- Dating

If Dating selected:

show sub-options:

- Casual Dating
- Serious Relationship

## Requirement

Minimum one intent.

## Important UX Copy

> You control which types of connections you appear in.

## CTA

**Continue**

## Backend

PUT `/users/me/intents`

## Analytics

- intent_selected
- dating_enabled

---

# SCREEN O05 — DATING CONSENT

Only displayed if Dating selected.

## Purpose

Obtain explicit dating discoverability consent.

## UI

Explain:

- profile can appear to mutually eligible users;
- dating can be turned off at any time;
- general social discovery remains separate.

Checkbox:

**I understand and want to enable Dating discovery.**

CTA:
**Enable Dating**

Secondary:
**Not Now**

## Rule

No dating exposure until affirmative consent.

## Backend

POST `/users/me/dating/consent`

Store:
- accepted_at;
- policy version.

---

# SCREEN O06 — LANGUAGES

## Purpose

Improve discovery relevance.

## UI

Searchable multi-select list.

Common languages promoted first.

Minimum:
1.

Suggested:
English plus regional languages.

## Available Initial Options

- English
- Telugu
- Tamil
- Kannada
- Hindi
- Malayalam
- Gujarati
- Punjabi
- Bengali
- Marathi
- Urdu
- Odia

## CTA

**Continue**

## Backend

PUT `/users/me/languages`

---

# SCREEN O07 — INTERESTS

## Purpose

Capture meaningful compatibility signals.

## UI

Category sections.

Selectable chips/cards.

## Requirement

Minimum:
3.

Suggested:
5–10.

## Counter

`5 selected`

## Categories

As defined in PRD taxonomy.

## CTA

**Continue**

Disabled below minimum.

## Backend

PUT `/users/me/interests`

## Analytics

- interest_selected
- onboarding_interest_count

---

# SCREEN O08 — PROFILE PHOTO

## Purpose

Establish human identity.

## Requirement

At least one photo.

## UI

Photo grid with six slots.

Actions:

- Camera
- Photo Library

## First Photo

Automatically primary unless changed later.

## Permissions

Camera/gallery permission requested contextually.

## Client Validation

- allowed image MIME types;
- image dimensions;
- maximum upload size.

## Backend

1. request signed upload;
2. upload;
3. create media record;
4. run moderation;
5. attach profile photo.

## States

- uploading;
- processing;
- approved;
- rejected.

## Reject Message Example

> This image can't be used as a profile photo. Please choose a clear photo of yourself.

## Safety

Block:

- explicit content;
- QR codes;
- advertisements;
- contact information;
- obvious impersonation patterns.

---

# SCREEN O09 — ABOUT YOU

## Fields

### Bio
Optional.

Max:
300 characters.

Prompt:
**Tell people a little about yourself**

### Profession
Optional.

Max:
80.

### Industry
Optional controlled selector.

### Hometown / Origin
Optional.

Examples:
Hyderabad, Telangana

## Validation

Bio may not contain:

- explicit solicitation;
- phone number;
- email;
- suspicious URLs.

## CTA

**Continue**

---

# SCREEN O10 — VERIFICATION PROMPT

## Purpose

Encourage selfie verification.

## UI

Badge graphic.

Title:

**Build trust with a verified profile**

Benefits:

- verified badge;
- increased trust;
- potentially stronger discovery ranking.

Primary:
**Verify Me**

Secondary:
**Do This Later**

## P1 Rule

Verification strongly encouraged but not necessarily hard requirement for MVP.

---

# SCREEN O11 — SELFIE VERIFICATION

## Provider-dependent flow

UI may be native/custom or hosted SDK.

## Steps

1. camera permission;
2. face positioning;
3. liveness challenge;
4. submit;
5. processing.

## Result States

- verified;
- retry required;
- manual review;
- failed.

## Security

Selfie verification artifacts require strict retention policy.

No broad internal visibility.

---

# SCREEN O12 — NOTIFICATIONS PERMISSION

## Purpose

Contextually explain benefits before OS prompt.

## UI

Title:
**Don't miss a connection**

Benefits:

- new connection requests;
- accepted requests;
- messages;
- event reminders.

Primary:
**Enable Notifications**

Secondary:
**Not Now**

Only after user taps primary trigger OS permission.

## Rule

Never show OS notification permission cold on first launch.

---

# SCREEN O13 — ONBOARDING COMPLETE

## UI

Progress celebration.

Title:

**You're ready to connect.**

Summary:

- city;
- intents;
- interests;
- verification badge if applicable.

CTA:
**Explore People**

Navigation:
→ D01 Discover

---

# SECTION C — DISCOVER

---

# SCREEN D01 — DISCOVER HOME

## Purpose

Primary engagement surface.

## Header

Greeting optional.

Current location:

`Frisco · DFW`

Notification icon.

## Mode Selector

Horizontal control:

- For You
- Friends
- Activities
- Networking
- Dating

Only show modes enabled by user's intents.

## Content Modules

Priority:

1. Recommended for You
2. New Around You
3. Shared Interests
4. Upcoming Events
5. New to DFW
6. Language-based recommendations
7. Dating recommendations if enabled

## Profile Card Data

- primary photo;
- first name;
- age where context appropriate;
- city;
- approximate distance;
- verification badge;
- 2–3 shared interests;
- matching-intent label.

Example:

**Ananya, 31**  
Plano · ~12 mi  
✓ Verified  
Coffee · Telugu Movies · Travel  
Looking for: Friendship

## Card Actions

Primary:
**View Profile**

Optional secondary:
**Connect**

Avoid Tinder-like swipe mechanics in V1.

## Backend

GET `/discovery`

Parameters:

- mode;
- cursor;
- filter state;
- metro;
- user context.

## Pagination

Cursor-based.

## Loading

Skeleton cards.

## Empty

Example:

> We’re still growing near you.

Actions:

- Expand distance
- Change filters
- Invite friends

## Analytics

- discovery_viewed
- profile_impression
- mode_changed

---

# SCREEN D02 — DISCOVERY FILTERS

## Purpose

Allow user-controlled refinement.

## Filters

### Distance
Slider:
5 / 10 / 25 / 50+ miles

### Age Range
Dating:
mandatory-compatible context.

Social:
optional.

### Languages
multi-select.

### Interests
multi-select.

### Verified Only
Premium candidate.

### City
select list.

### Intent
only mutually compatible intents.

## Actions

Primary:
**Apply Filters**

Secondary:
**Reset**

## Backend

Filters may be local state then included in discovery API.

Persist latest filter preferences server-side or locally.

## Validation

Min age <= max age.

Distance within supported range.

---

# SCREEN D03 — USER PROFILE DETAIL

## Purpose

Give enough context to decide whether to connect.

## Header

Back

Overflow:
- Report
- Block

## Content

### Hero
Primary photo carousel.

### Identity
First name
Age
Verification badge
City
Approx distance

### Intent
"Open to Friendship"

### Bio

### Shared Interests
Visually emphasize shared items.

### Languages

### Profession
If user allowed visibility.

### Additional Interests

## Primary CTA

**Connect**

If request pending:
**Request Sent**

If connected:
**Message**

If blocked:
screen unavailable.

## Backend

GET `/profiles/{profileId}`

Respect privacy field projection server-side.

## Analytics

- profile_opened
- profile_photo_viewed

---

# SCREEN D04 — CONNECT REQUEST COMPOSER

## Purpose

Make connection contextual and consent-based.

## Header

Connect with [First Name]

## Field 1 — Reason

Required controlled selector.

Only show mutually valid reasons.

Examples:

- Friendship
- Coffee
- Dining
- Sports / Activity
- Networking
- Local Community
- Dating
- Serious Relationship

## Field 2 — Intro Message

Optional.

Max:
200 characters.

Counter visible at 150+.

## Safety Validation

Reject obvious:

- phone numbers if policy enabled;
- URLs;
- spam text;
- explicit content.

## Primary CTA

**Send Request**

## Backend

POST `/connections/requests`

Payload:

- target_user_id;
- reason_code;
- intro_message.

## Rules

Backend checks:

- not blocked;
- target discoverable;
- intents compatible;
- sender not rate-limited;
- no duplicate active request;
- account status allowed.

## Success

Toast:

**Connection request sent**

Navigate back/profile updates state.

## Analytics

- connection_started
- connection_sent

---

# SCREEN D05 — DAILY LIMIT REACHED

## Purpose

Explain anti-abuse limit.

## Message

**You've reached today's connection limit.**

Supporting:

Limits help keep requests thoughtful and reduce spam.

If premium supports higher threshold:

CTA:
**View Connect Plus**

Secondary:
**Got It**

Do not present safety limit solely as manipulative paywall.

---

# SECTION D — CONNECTIONS

---

# SCREEN C01 — CONNECTIONS HUB

## Tabs

1. Received
2. Sent
3. Connected

Default:
Received if unread/new requests exist.

---

# SCREEN C02 — RECEIVED REQUESTS

## Request Card

- photo;
- name;
- verification;
- city;
- reason;
- shared interests;
- intro message snippet;
- time received.

Actions:

- Accept
- Decline
- View Profile

Overflow:
- Block
- Report

## Backend

GET `/connections/requests/incoming`

---

# SCREEN C03 — REQUEST DETAIL

## Purpose

Allow thoughtful decision.

Display complete:

- sender profile summary;
- connection reason;
- intro message;
- shared interests;
- trust indicators.

## Primary Actions

**Accept**

**Decline**

Secondary:

- Block
- Report

## Accept Backend

POST `/connections/requests/{id}/accept`

Atomic behavior:

- request becomes accepted;
- mutual connection created;
- conversation thread initialized.

## Success

Screen:

**You're connected**

Buttons:

- Send Message
- View Connections

---

# SCREEN C04 — DECLINE CONFIRMATION

Usually no confirmation needed.

Tap Decline:
immediately mark declined.

Undo snackbar may be allowed briefly if architecture supports safe rollback.

Sender should not receive explicit rejection notification.

---

# SCREEN C05 — SENT REQUESTS

Cards show:

- person;
- reason;
- status;
- expiry.

Statuses:

- Pending
- Accepted
- Expired

For pending:

CTA:
**Cancel Request**

## Backend

DELETE or POST cancel endpoint.

---

# SCREEN C06 — CONNECTED USERS

List:

- photo;
- name;
- last interaction;
- intent context;
- message CTA.

Sort:

most recent interaction.

Search:
existing connections only.

---

# SECTION E — MESSAGING

---

# SCREEN M01 — MESSAGE LIST

## Purpose

Entry to active conversations.

## Row

- avatar;
- name;
- verification badge optional;
- last message preview;
- timestamp;
- unread badge;
- muted icon.

## Header

Messages

Search icon.

## Backend

GET `/conversations`

Cursor pagination.

## Empty State

**No conversations yet**

CTA:
**Discover People**

---

# SCREEN M02 — CONVERSATION

## Header

Avatar
Name
Verification
Tap → profile

Overflow:

- View Profile
- Mute
- Disconnect
- Block
- Report

## Message Composer

Text input.

Placeholder:
**Message [Name]**

Send button.

## V1 Content

Text mandatory capability.

Images optional only if safety infrastructure ready.

## Message Rules

Max text:
2,000 characters.

Prevent:

- empty messages;
- oversized payloads.

## Delivery States

- sending;
- sent;
- failed.

Optional:
- delivered.

Read receipts only if product chooses.

## Backend

Write path: `POST /api/v1/conversations/{id}/messages` (authenticate → authorize → persist → commit → outbox/realtime publish).

Delivery: WebSocket realtime, push fallback when offline.

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-04:** the former wording "WebSocket/realtime recommended. POST fallback." is superseded by ADR-008. WebSocket is delivery transport only, never the authoritative write path.

## Network Failure

Failed message visibly marked:

**Tap to retry**

## Safety

Blocked/disconnected user composer disabled.

## Analytics

- conversation_opened
- message_sent
- message_delivery_failed

> **Amended 2026-10-04 — R-03:** `chat_opened` is superseded by `conversation_opened`; failure naming follows the Analytics Spec (`message_delivery_failed`).

---

# SCREEN M03 — DISCONNECT CONFIRMATION

## Copy

**Disconnect from [Name]?**

They won't be able to message you unless a future connection is allowed.

Actions:

- Disconnect
- Cancel

Optional additional:

**Block them too**

## Backend

POST `/connections/{id}/disconnect`

---

# SCREEN M04 — BLOCK CONFIRMATION

## Copy

**Block [Name]?**

They will no longer be able to find your profile, send requests, or message you.

Actions:

**Block**

Cancel

## Backend

POST `/users/{id}/block`

Server must immediately enforce all interaction restrictions.

---

# SCREEN M05 — REPORT USER

## Step 1 Category

Radio selection:

- Fake profile
- Spam
- Harassment
- Inappropriate messages
- Sexual content
- Hate or abusive behavior
- Impersonation
- Scam or fraud
- Underage concern
- Safety threat
- Other

CTA:
**Continue**

---

# SCREEN M06 — REPORT DETAILS

## Fields

Optional detail textarea.

Max:
1000.

Optional evidence selection if conversation exists.

Explain:

> Relevant recent messages may be included with your report for safety review.

## CTA

**Submit Report**

## Backend

POST `/reports`

Store:

- reporter;
- subject;
- category;
- text;
- evidence references;
- timestamps;
- source context.

## High-Severity Handling

Backend severity classifier/rules.

Potential immediate restriction.

---

# SCREEN M07 — REPORT CONFIRMATION

## UI

Title:
**Thanks for reporting this**

Body:

Our safety team will review the report.

Actions:

- Block This User
- Done

If user already blocked:
only Done.

---

# SECTION F — EVENTS

---

# SCREEN E01 — EVENTS HOME

## Purpose

Discover local activities and community experiences.

## Header

Events
Location indicator

## Filters

- All
- Social
- Sports
- Cultural
- Professional
- Dating

Dating events visible only if eligible/configured.

## Sections

- This Week
- Near You
- Popular
- Based on Your Interests

## Event Card

- cover image;
- title;
- date;
- location;
- organizer;
- category;
- RSVP count;
- free/paid label.

## Backend

GET `/events`

---

# SCREEN E02 — EVENT FILTERS

Fields:

- date;
- distance;
- category;
- free/paid if paid enabled;
- interest.

CTA:
Apply

Reset.

---

# SCREEN E03 — EVENT DETAIL

## Content

Cover image.

Title.

Date/time.

Venue.

Map preview.

Organizer.

Verification/approved organizer badge.

Description.

Category.

Capacity.

Going count.

Eligibility notes.

## CTA States

Not RSVP'd:
**RSVP**

RSVP'd:
**Going ✓**

Full:
**Join Waitlist**

Cancelled:
disabled.

## Secondary

Share Event

Report Event if appropriate.

## Backend

GET `/events/{id}`

---

# SCREEN E04 — RSVP CONFIRMATION

Tap RSVP.

If no eligibility issues:

POST `/events/{id}/rsvp`

Success modal/sheet:

**You're going**

Show:

- date;
- location;
- Add to Calendar;
- View Attendees if enabled.

---

# SCREEN E05 — RSVP CANCELLATION

Action:
**Cancel RSVP**

Confirmation optional.

Backend removes RSVP.

If waitlist:
promote according to business rules.

---

# SCREEN E06 — EVENT ATTENDEES

Only if enabled by feature flag.

## Preconditions

- viewer RSVP'd;
- event permits attendee discovery;
- listed users opted into attendee visibility.

## Cards

Minimal profile:

- photo;
- first name;
- city;
- shared interests.

CTA:
View Profile.

Attendance does not imply dating consent.

---

# SCREEN E07 — ADD TO CALENDAR

Use native device calendar integration.

Ask permission contextually.

Create:

- title;
- time;
- location;
- notes.

No hidden tracking data.

---

# SECTION G — NOTIFICATIONS

---

# SCREEN N01 — NOTIFICATION CENTER

## Entries

Types:

- connection request;
- request accepted;
- new message;
- event reminder;
- event update;
- event cancellation;
- verification result;
- account/safety alert.

## Row

Icon
Title
Body
Timestamp
Unread marker

Tap routes contextually.

## Backend

GET `/notifications`

POST `/notifications/{id}/read`

---

# SCREEN N02 — NOTIFICATION SETTINGS

Toggles:

- Connection Requests
- Messages
- Events
- Community Updates
- Product Updates
- Marketing

## Rules

Security/account-critical alerts may not be optional.

## Backend

PUT `/users/me/notification-preferences`

---

# SECTION H — PROFILE

---

# SCREEN P01 — MY PROFILE

## Purpose

Self-view and control center.

## Header

Profile

Edit icon.

## Content

Profile completion bar.

Photo gallery.

Display identity.

Verification.

Current intentions.

Bio.

Languages.

Interests.

Profession.

## Buttons

- Edit Profile
- Verification
- Preview My Profile

## Settings entry below.

---

# SCREEN P02 — EDIT PROFILE

## Sections

### Photos
Manage up to 6.

### Name
First name.

### Bio
300 max.

### Profession
80 max.

### Industry

### City

### Hometown

### Languages

### Interests

## Save Behavior

Prefer autosave section-by-section or explicit Save per screen.

Avoid one enormous save transaction.

---

# SCREEN P03 — MANAGE PHOTOS

## Grid

Six slots.

Actions per image:

- Set as Primary
- Replace
- Delete

## Delete Rule

Cannot delete only remaining image if minimum profile photo requirement remains.

## Drag/Reorder

Optional.

Backend persists order.

---

# SCREEN P04 — EDIT INTENTS

Show:

- Friendship
- Activities
- Professional Networking
- Dating

## If Turning Dating On

→ Dating Consent

## If Turning Dating Off

Confirmation:

**Turn off Dating?**

Effect:

- removed from dating discovery;
- existing dating conversations remain unless product policy says otherwise.

Default recommendation:
existing connections remain.

---

# SCREEN P05 — DATING PREFERENCES

Only available if Dating enabled.

## Fields

- age range;
- distance;
- gender preference;
- relationship intent.

Potential future:
language, etc.

## Privacy

Dating preference is not publicly displayed except compatible context where needed.

## Validation

Age >=18.

Min <= max.

---

# SCREEN P06 — DISCOVERY PREFERENCES

Fields:

- maximum distance;
- city;
- visible modes;
- verified only if entitlement;
- pause discovery.

---

# SCREEN P07 — PAUSE DISCOVERY

Toggle.

When enabled:

Display notice:

**Your profile is hidden from new discovery. Existing connections and messages still work.**

Backend:
PATCH discoverable=false

---

# SCREEN P08 — VERIFICATION STATUS

States:

### Not Verified
CTA:
Verify Profile

### Pending
Message:
Verification under review.

### Verified
Badge and completion timestamp optional.

### Failed
Explain retry path without exposing risk model.

---

# SCREEN P09 — PRIVACY SETTINGS

Controls:

- Show approximate distance
- Show profession
- Show languages
- Show event attendance
- Allow discovery
- Dating discovery

Links:

- Blocked Users
- Privacy Policy
- Data Controls

---

# SCREEN P10 — BLOCKED USERS

List blocked accounts.

Each:

- avatar;
- first name;
- blocked date.

CTA:
**Unblock**

## Confirmation

Unblocking does not automatically reconnect.

Backend:
DELETE block relationship.

---

# SCREEN P11 — SUBSCRIPTION

## Header

Connect Plus

## Current Plan State

Free:
show benefits.

Paid:
show:
- plan;
- renewal;
- status.

## Premium Benefits Candidate

- advanced filters;
- more requests;
- verified-only discovery;
- increased discovery limits;
- additional profile insights.

## CTA

Free:
**Upgrade**

Paid:
**Manage Subscription**

## Legal

Restore purchases button required for iOS where applicable.

---

# SCREEN P12 — PAYWALL

## Purpose

Explain premium value without coercion.

## Structure

Headline.

Benefit comparison.

Monthly plan.

Potential annual plan later.

Primary:
**Start Connect Plus**

Secondary:
**Not Now**

Footer:
- recurring billing disclosure;
- cancellation;
- Terms;
- Privacy.

## Backend

Store purchase handled using app store compliant billing.

Server validates receipt and grants entitlement.

Never trust client-only entitlement.

---

# SCREEN P13 — HELP & SUPPORT

Sections:

- Getting Started
- Safety
- Verification
- Connections
- Events
- Billing
- Account

Actions:

**Contact Support**

**Report a Technical Problem**

---

# SCREEN P14 — CONTACT SUPPORT

## Fields

Category:
- Account
- Safety
- Billing
- Technical
- Event
- Other

Subject.

Description.

Optional screenshot.

## Diagnostics

Automatically include non-sensitive:

- app version;
- OS version;
- device family;
- user ID.

Do not automatically include chat content.

---

# SCREEN P15 — COMMUNITY GUIDELINES

Readable content.

Sections:

- Respect
- Consent
- Harassment
- Spam
- Fraud
- Explicit Content
- Safety
- Reporting

Versioned policy.

---

# SCREEN P16 — ACCOUNT SETTINGS

Options:

- Phone Number
- Notification Settings
- Privacy
- Subscription
- Deactivate Account
- Delete Account
- Logout

---

# SCREEN P17 — DEACTIVATE ACCOUNT

## Explanation

Temporarily hide account.

Existing data retained.

Can sign back in to reactivate.

## CTA

**Deactivate My Account**

Requires re-authentication if high-risk policy dictates.

Backend:
POST `/users/me/deactivate`

---

# SCREEN P18 — DELETE ACCOUNT

## Step 1

Explain consequences:

- profile removed;
- discovery removed;
- connections affected;
- deletion/anonymization process initiated;
- subscription cancellation handled separately where applicable.

CTA:
**Continue**

---

# SCREEN P19 — DELETE CONFIRMATION

Require:

- OTP or recent authentication;
- explicit checkbox.

Checkbox:

**I understand this action is intended to permanently delete my account.**

Primary:
**Delete Account**

Destructive.

## Backend

POST `/users/me/delete-request`

Create deletion workflow.

Clear active sessions.

---

# SCREEN P20 — ACCOUNT RESTRICTED

For Limited/Under Review/Suspended.

## UI

Title based on status.

Explain at appropriate level.

Do not expose internal moderation evidence.

Actions:

- Contact Support
- Review Guidelines
- Logout

---

# SCREEN P21 — LOGOUT CONFIRMATION

Message:
**Log out of Project Connect?**

Actions:
- Log Out
- Cancel

Clear local tokens securely.

---

# SECTION I — SEARCH WITHIN EXISTING CONNECTIONS

---

# SCREEN S01 — CONNECTION SEARCH

Scope limited to existing connected users.

Search:

- first name;
- optionally conversations.

Not global user directory.

## Backend

GET `/connections?query=`

---

# SECTION J — INVITES / REFERRALS

---

# SCREEN R01 — INVITE FRIENDS

## Purpose

Controlled network growth.

## UI

Referral link.

Buttons:

- Share via WhatsApp
- Copy Link
- Share...

Do not auto-access contacts.

## Tracking

Referral code tied to campaign/user.

Backend:

POST `/referrals/link`

---

# SCREEN R02 — EVENT SHARE

Share payload:

event title;
date;
deep link.

Do not include private attendee info.

---

# SECTION K — ADMIN WEB CONSOLE

---

# SCREEN ADM01 — ADMIN LOGIN

## Authentication

SSO recommended. **MFA mandatory** for all staff.

No shared credentials.

## Roles

- Super Admin
- Moderator
- Event Manager
- Support Agent

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-07, R-10:** "SSO/MFA strongly recommended" is superseded; MFA is mandatory for every staff role. `SUPPORT_AGENT` is an approved staff role per the Authorization Spec.

---

# SCREEN ADM02 — ADMIN DASHBOARD

Widgets:

- active users;
- new users;
- pending reports;
- verification queue;
- active events;
- suspended accounts;
- operational alerts.

No unnecessary PII exposure.

---

# SCREEN ADM03 — USER SEARCH

Search by permitted identifiers:

- internal user ID;
- phone only for authorized roles;
- first name;
- status.

Filters:

- account status;
- verification;
- report history;
- join date.

---

# SCREEN ADM04 — USER DETAIL

Sections:

- identity summary;
- profile;
- verification;
- account status;
- report count;
- moderation history;
- connection-risk metrics where appropriate.

Actions role-dependent:

- Warn
- Limit
- Suspend
- Ban
- Restore

All actions require:

- reason;
- audit log;
- actor ID;
- timestamp.

---

# SCREEN ADM05 — REPORT QUEUE

Columns:

- report ID;
- category;
- severity;
- reported user;
- reporter;
- submitted date;
- assigned moderator;
- status.

Filters:

- high severity;
- unassigned;
- overdue;
- category.

---

# SCREEN ADM06 — REPORT DETAIL

Display:

- report category;
- reporter statement;
- relevant evidence only;
- subject account context;
- prior reports.

Actions:

- No Action
- Warn
- Restrict
- Suspend
- Ban
- Escalate

Internal notes required for enforcement actions.

---

# SCREEN ADM07 — EVENTS LIST

Columns:

- event;
- organizer;
- date;
- RSVP count;
- status;
- category.

Actions:

- Create
- Edit
- Cancel
- Archive

---

# SCREEN ADM08 — CREATE / EDIT EVENT

Fields:

- title;
- description;
- category;
- cover image;
- date;
- start/end time;
- venue;
- map location;
- organizer;
- capacity;
- eligibility;
- attendee visibility;
- free/paid;
- status.

Validation:

- end > start;
- future event;
- valid venue;
- capacity positive;
- category required.

---

# SCREEN ADM09 — ORGANIZER MANAGEMENT

List approved organizers.

Fields:

- name;
- organization;
- contact;
- status;
- events created.

Actions:

- Approve
- Revoke
- Suspend

---

# SCREEN ADM10 — TAXONOMY CONFIGURATION

Manage:

- interests;
- languages;
- event categories;
- connection reasons.

Fields:

- code;
- label;
- active;
- sort order.

Never delete in-use codes directly; deactivate instead.

---

# SCREEN ADM11 — FEATURE FLAGS

Flags:

- Dating
- Premium
- Selfie Verification
- Event Attendee Discovery
- Experimental Discovery
- New Event Features

Requirements:

- environment awareness;
- rollout percentage where supported;
- audit history.

---

# SECTION L — GLOBAL MODALS AND SYSTEM STATES

---

# MODAL G01 — GENERIC NETWORK ERROR

Title:
**Connection problem**

Body:
Check your internet connection and try again.

Buttons:
Retry
Cancel

---

# MODAL G02 — SERVER ERROR

Title:
**We couldn't complete that**

Body:
Your information is safe. Please try again.

No raw error messages.

---

# MODAL G03 — SESSION EXPIRED

Title:
**Please sign in again**

CTA:
Sign In

Preserve safe local draft data where possible.

---

# MODAL G04 — PERMISSION EXPLANATION

Used before OS permission.

Types:

- location;
- camera;
- notifications;
- photos;
- calendar.

Each explanation must state why permission helps.

---

# MODAL G05 — PERMISSION DENIED

Explain manual Settings path.

Button:
**Open Settings**

---

# SECTION M — SCREEN STATE REQUIREMENTS

Every applicable screen must define the following implementation states.

## Loading

Skeleton or progress.

## Loaded

Standard content.

## Empty

Clear explanation and actionable CTA.

## Partial

Some modules unavailable but screen usable.

## Offline

Cached data displayed where safe.

## Error

Retry available.

## Unauthorized

Redirect or access message.

## Restricted

Account-action context.

---

# SECTION N — VALIDATION RULE CATALOG

## Names

- 1–50 chars;
- no URLs;
- no phone number strings;
- no obvious spam;
- Unicode supported.

## Bio

- max 300;
- sanitized;
- backend moderation.

## Intro Message

- max 200;
- URL restriction;
- spam heuristics.

## Chat Message

- max 2000;
- sanitized;
- no executable HTML.

## Support Message

Reasonable upper bound:
5,000.

## Report Detail

max 1,000.

---

# SECTION O — BACKEND ACTION MATRIX

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-06:** paths below are relative to the consumer namespace `/api/v1` (for example `POST /api/v1/connections/requests/{id}/accept`). Admin endpoints use `/admin/v1`.

## Authentication

```text
POST /auth/otp/request
POST /auth/otp/verify
POST /auth/refresh
POST /auth/logout
```

## User

```text
GET   /users/me
PATCH /users/me/profile
PUT   /users/me/intents
PUT   /users/me/interests
PUT   /users/me/languages
PUT   /users/me/privacy
PUT   /users/me/preferences
POST  /users/me/deactivate
POST  /users/me/delete-request
```

## Verification

```text
POST /verification/start
GET  /verification/status
```

## Discovery

```text
GET /discovery
GET /profiles/{id}
```

## Connections

```text
POST /connections/requests
GET  /connections/requests/incoming
GET  /connections/requests/outgoing
POST /connections/requests/{id}/accept
POST /connections/requests/{id}/decline
POST /connections/requests/{id}/cancel
GET  /connections
POST /connections/{id}/disconnect
```

## Messaging

```text
GET  /conversations
GET  /conversations/{id}/messages
POST /conversations/{id}/messages
```

Realtime channel required separately.

## Safety

```text
POST   /users/{id}/block
DELETE /users/{id}/block
GET    /users/me/blocked
POST   /reports
```

## Events

```text
GET  /events
GET  /events/{id}
POST /events/{id}/rsvp
DELETE /events/{id}/rsvp
GET /events/{id}/attendees
```

## Notifications

```text
GET /notifications
POST /notifications/{id}/read
PUT /users/me/notification-preferences
```

## Subscription

Provider-specific endpoints:

```text
GET  /subscriptions/me
POST /subscriptions/validate-receipt
POST /subscriptions/restore
```

---

# SECTION P — NAVIGATION TRANSITION MATRIX

## Signup

```text
Welcome
→ Age
→ Phone
→ OTP
→ Name
→ Gender
→ Location
→ Intent
→ Dating Consent if needed
→ Languages
→ Interests
→ Photos
→ About
→ Verification
→ Notifications
→ Onboarding Complete
→ Discover
```

## Person Connection

```text
Discover
→ Profile
→ Connect
→ Request Sent
→ Received by Other User
→ Accept
→ Connection Created
→ Conversation
```

## Safety

```text
Profile or Conversation
→ Report
→ Category
→ Details
→ Confirmation
→ Optional Block
```

## Events

```text
Events
→ Event Detail
→ RSVP
→ Confirmation
→ Reminder
→ Event
→ Post-event discovery
```

---

# SECTION Q — ANALYTICS SCREEN REQUIREMENTS

Each screen should emit:

## Standard Screen Event

`screen_viewed`

Properties:

- screen_id;
- source_screen;
- app_version;
- session_id;
- experiment flags.

Do not attach sensitive content.

## Important CTA Event Pattern

`cta_tapped`

Properties:

- screen_id;
- action_code.

Business-specific events remain explicit as defined in the Analytics Spec.

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-03, R-19:** event names come from the Analytics Spec (canonical for analytics taxonomy). `screen_viewed` / `cta_tapped` must not substitute for semantic product events; any low-level UI telemetry requires separate governance.

---

# SECTION R — ACCESSIBILITY SCREEN STANDARDS

Every screen must satisfy:

## Text

Support dynamic type.

No clipped essential text.

## Controls

Minimum platform-recommended touch size.

## Labels

Every icon-only action has accessible label.

Examples:

- Back
- More options
- Notifications
- Verification status

## Focus

Logical screen-reader focus order.

## Color

Never use color alone to communicate:

- error;
- verification;
- pending;
- acceptance.

## Images

Profile photo:
accessible context such as:

`Profile photo of Ananya`

Decorative images should not pollute accessibility tree.

---

# SECTION S — SECURITY UX REQUIREMENTS

Never display:

- access tokens;
- internal IDs;
- raw API errors;
- full phone numbers unnecessarily;
- precise user coordinates.

Sensitive actions requiring recent authentication can include:

- phone change;
- account deletion;
- high-risk moderation appeal.

---

# SECTION T — DESIGN SYSTEM COMPONENT INVENTORY

Engineering should implement reusable primitives before individual screens.

## Core

- AppShell
- ScreenHeader
- BottomNavigation
- PrimaryButton
- SecondaryButton
- DestructiveButton
- TextButton
- IconButton
- TextInput
- TextArea
- SearchInput
- Checkbox
- Radio
- Toggle
- Select
- MultiSelect
- Chip
- Slider

## Identity

- Avatar
- ProfilePhotoCarousel
- VerificationBadge
- UserSummaryCard
- ProfileCompletionBar

## Discovery

- PersonCard
- InterestChip
- IntentBadge
- DistanceLabel
- SectionCarousel

## Connections

- ConnectionRequestCard
- ConnectionStatusBadge

## Messaging

- ConversationRow
- MessageBubble
- MessageComposer
- DeliveryState

## Events

- EventCard
- EventHero
- RSVPButton
- AttendeeAvatarStack

## System

- Skeleton
- EmptyState
- InlineError
- Toast
- Snackbar
- ConfirmationSheet
- BottomSheet
- LoadingOverlay
- OfflineBanner

---

# SECTION U — SCREEN PRIORITY FOR ENGINEERING

## Foundation

1. Splash
2. Welcome
3. Auth
4. Onboarding
5. Main navigation
6. Profile primitives

## Core Vertical Slice

7. Discover
8. Profile detail
9. Connection request
10. Received request
11. Accept
12. Chat

This should become the first end-to-end implementation proof.

## Safety

13. Block
14. Report
15. Moderation integration

## Events

16. Events home
17. Event detail
18. RSVP

## Account

19. Profile/settings
20. Privacy
21. Deactivate/delete

## Monetization

22. Subscription
23. Paywall

---

# SECTION V — FIRST END-TO-END TEST JOURNEY

The first production-quality vertical slice must prove:

```text
New User A
→ Signs up
→ Creates profile
→ Appears in discovery

User B
→ Opens User A
→ Sends Friendship request

User A
→ Receives request
→ Accepts

Both
→ Become connected

User B
→ Sends message

User A
→ Responds

System
→ Counts Meaningful Connection
```

This proves:

- identity;
- onboarding;
- discovery;
- permissions;
- connection system;
- messaging;
- analytics;
- notifications;
- database relationships;
- backend authorization.

Do this before building secondary breadth.

---

# SECTION W — QA SCREEN ACCEPTANCE TEMPLATE

Every screen ticket must use:

## Visual
- matches design system;
- no overflow;
- small and large devices supported.

## Functional
- all actions work;
- disabled states correct;
- duplicate submission prevented.

## Validation
- required fields;
- boundary values;
- invalid formats;
- server errors.

## Navigation
- back works;
- deep links appropriate;
- state preserved.

## Accessibility
- screen reader;
- dynamic type;
- focus order.

## Analytics
- required events emitted once.

## Security
- unauthorized requests blocked server-side.

## Offline
- behavior defined.

---

# SECTION X — CRITICAL PRODUCT DECISIONS FROZEN BY THIS SPEC

The following may not be changed casually during implementation:

1. No unrestricted stranger DMs.
2. Connection acceptance precedes messaging.
3. Dating requires explicit opt-in.
4. Non-dating users do not appear in dating discovery.
5. Exact user location is never publicly exposed.
6. Public user-created groups are not V1.
7. Social feed is not V1.
8. Native video calling is not V1 launch-critical.
9. Public events require approved organizers/admin.
10. Report and block are mandatory launch capabilities.
11. Phone verification is mandatory.
12. Safety features are never premium-only.
13. Admin moderation console is part of V1.
14. Global full-name user search is not provided.
15. The product launches metro-first rather than globally.

---

# SECTION Y — ARTIFACTS REQUIRED NEXT

After this document, the implementation sequence should be:

## 1. UX Wireframes

Every screen in this spec mapped visually.

## 2. Design System Specification

Detailed:

- colors;
- typography;
- spacing;
- radius;
- shadows;
- component states;
- dark mode;
- icons;
- motion.

## 3. Functional Requirements Matrix

Requirement IDs linked to:

- screens;
- APIs;
- user stories;
- QA tests.

## 4. Business Rules Catalog

Formal rules for:

- matching;
- visibility;
- blocking;
- dating eligibility;
- rate limits;
- requests;
- event eligibility;
- subscriptions.

## 5. Data Model / Data Dictionary

Entities, fields, relationships, privacy classes.

## 6. Role & Permission Matrix

User/admin/moderator/organizer permissions.

## 7. Trust & Safety Operating Specification

Moderation SLA, escalation, evidence retention, enforcement.

## 8. Analytics Tracking Specification

Exact events, properties, funnels, dashboards.

## 9. Technical Architecture

Mobile, backend, auth, realtime, database, storage, notifications, moderation, analytics, subscription.

## 10. Claude Code Engineering Constitution

Only after the above foundation is sufficiently stable.

---

# FINAL IMPLEMENTATION DIRECTION

The application must not be built as disconnected screens.

The first architecture validation must implement one complete user-value flow:

```text
Identity
→ Profile
→ Discovery
→ Connection Request
→ Consent
→ Messaging
→ Meaningful Connection
```

Everything else extends that core.

The design team must preserve the fundamental product personality:

**trusted, intentional, local, human, premium, and safe.**

The engineering team must preserve the fundamental interaction rule:

**discovery is open; communication is permissioned.**

The product team must preserve the fundamental business strategy:

**build local community liquidity first, then monetize improved discovery and high-value connection modes.**