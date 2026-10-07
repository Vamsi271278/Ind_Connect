# Phase 2 — Product Slice Decisions (Registration → Onboarding)

| Field | Value |
|---|---|
| Status | **APPROVED** (recorded resolutions) |
| Date | 2026-10-05 |
| Approved by | Project owner |
| Scope | First product slice: registration, phone OTP, age gate, sessions (B1), onboarding API + mobile foundation (B2) |

This document **records resolutions** made while implementing the first product slice. It does **not** supersede accepted ADRs, `GOVERNANCE-RESOLUTIONS-V1.1.md` or the canonical domain documents (GR-003). Where an implementation deliberately narrows a canonical document, the divergence is stated explicitly below rather than implied.

---

## D11 — Mobile installation identifier

**APPROVED.** Use `expo-crypto@57.0.3` (SDK-57 tagged, documented Expo API) behind a single wrapper, `generateInstallId()`. The rest of the app never imports `expo-crypto` directly.

- Not `globalThis.expo.uuidv4()`: although its native generators are cryptographically sound (Android `UUID.randomUUID()` / `SecureRandom`; iOS `UUID()`), it is an internal runtime global rather than documented public API, and therefore fragile across Expo upgrades.
- Contract: UUID v4; generated once per installation; persisted in SecureStore; reused across launches, sign-in and logout; regenerated only when storage is genuinely absent; never falls back to `Math.random`; **not** a credential or secret.
- **Logout preserves the install ID** — it identifies the installation, not the session. Refresh sessions bind `device_context.installId` to it.
- Runtime smoke test required once B2 mobile plumbing exists: generate → save → restart → same ID (Android emulator first, iOS later).
  - **Android: PASSED 2026-10-05** (Pixel 9 Pro XL emulator, Expo Go, SDK 57). The ID was unchanged across a force-stop/relaunch, and across a full sign-up → onboarding → sign-out cycle in which the server revoked the session (`POST /auth/logout` 204). **iOS: pending** (no macOS device available).

---

## B2-C1 — App bootstrap contents (ADR-076)

**APPROVED.** `GET /api/v1/app/bootstrap` is publicly callable and returns the ADR-076 state:

```text
{ maintenanceMode, minimumSupportedVersion, featureFlags, account: null | { status, onboardingStatus, onboardingStep } }
```

- No token → `account: null`. Valid access token → `account` populated. Invalid / expired / revoked token → `account: null` — **never an error**, so maintenance and update gating work even when authentication is broken.
- Restricted accounts (e.g. SUSPENDED) still receive their status, for routing.
- **Client rule:** `account: null` alone must **not** log the user out. If a refresh credential exists, the client first restores/refreshes the session; only an actual failed restoration (`SESSION_INVALID`) clears auth state.
- `featureFlags` come from configuration (`FEATURE_FLAGS`) until ADR-032's persistent flag store is built; that store is out of scope for B2.
- **Deferred:** subscription entitlement (listed in SFS A01) is omitted until the billing slice. No placeholder shape is invented; the backend will remain authoritative for entitlement.
- Account/onboarding routing uses bootstrap's `account`; `GET /users/me` provides the richer private self projection.

---

## B2-C2 — O01 last name: deferred (explicit divergence)

**APPROVED — deliberate narrowing of SFS O01.**

> Last name is deferred from the initial onboarding implementation. O01 V1 implementation collects first name only. `last_name` remains a planned private optional profile field and requires an additive migration before implementation.

- SFS O01 lists an optional, private Last Name; DATA-MODEL defines `user_profiles.last_name VARCHAR(80)`. The reviewed migration `0000_identity_foundation` intentionally does not include it.
- No schema change, no migration and no `lastName` API field in B2. `PATCH /users/me/profile` rejects `lastName`.
- Rationale: not required to complete NAME (BR-PROF-001: surname not required), not public, not needed for authentication, authorization or discovery; adding it later is an additive nullable-column migration that does not change onboarding completion semantics.
- B3 visual design: the Name screen is designed with first name only.

---

## B2-D1 — Onboarding progression rule

**APPROVED.** Deterministic, data-derived and monotonic:

```text
NAME complete    ⇔ first name is a valid, non-blank value
GENDER complete  ⇔ gender code is valid, and SELF_DESCRIBE also has non-blank text

NAME incomplete           → onboarding_step = NAME
else GENDER incomplete    → GENDER
else                      → LOCATION   (this slice parks here)
```

- Never moves backwards; once at or beyond LOCATION, later name/gender edits do not change onboarding.
- Ownership: the profile module writes `user_profiles`; identity alone writes `users.onboarding_*` through its onboarding service, inside one shared UnitOfWork transaction.
- Merged-state invariant: a gender self-description exists if and only if the gender is SELF_DESCRIBE; choosing another gender clears it.

## B2-D2 — Analytics

**APPROVED.**

- `AnalyticsProvider` with `NoopAnalyticsProvider` in the app and `InMemoryAnalyticsProvider` in tests. No logging adapter; PostHog later.
- Canonical events only: `otp_verified` (backend-confirmed) and `onboarding_step_completed` with `step_code` = canonical `onboarding_step` codes.
- The server does **not** fabricate `duration_seconds`; the mobile screen lifecycle supplies it in B3 through the approved analytics path. The backend remains authoritative for whether a step completed.
- `user_id_pseudonymous` is a keyed HMAC of the user ID — never the raw UUID, phone, email or name. Names, gender text, DOB, phone, OTPs and tokens never enter analytics. Events are emitted only after commit and never on idempotent replays.
- SFS A01 names `app_opened` / `bootstrap_*` are not in the Analytics Specification registry and are not emitted.

## B2-D3 — Profile update rate limit

**DEFERRED.** No profile-specific limiter without a requirement or observed abuse. A generic authenticated-mutation protection strategy or endpoint-specific limits may be added later on threat-analysis evidence.

## B2-D4 — Mobile unit tests

**APPROVED.** Non-React-Native business/client logic (session, refresh, API client, install ID) is unit-tested with the existing root Vitest. No component-test dependency (Phase 1 D5 stands).

## B2-D5 — Design tokens and provisional colors

**APPROVED with boundary.** `packages/design-tokens` provides primitive → semantic (light/dark) → minimal component tokens per DESIGN-SYSTEM §36, with automated WCAG 2.2 AA contrast tests and an architecture rule forbidding raw hex colors in `apps/*/src` feature code (token package, test fixtures and generated files excepted).

- Colour values are **provisional** and labelled `PROVISIONAL — replace after approved visual/Figma direction`. They are not Project Connect's brand design.
- B3 visual screens do **not** start until the visual-design exercise (Welcome, Age, Phone, OTP, Name, Gender, …) is approved.

## B2-D6 — OpenAPI

**APPROVED.** `packages/api-contracts` generates a real OpenAPI 3.1 document (`openapi.json`: paths, request bodies, responses, header parameters, security schemes, `components.schemas`) from the same Zod contracts the API validates with (`z.toJSONSchema`, no Swagger decorators or extra dependency). CI fails if the committed artifact differs from the generated one.

---

## Reconciled without new product policy (B2.1)

1. **Gender write path.** AUTHORIZATION §XXXI's writable list is an example; DATA-MODEL classifies gender as user-controlled and §9 lets users update editable profile fields. Gender is written via `PATCH /users/me/profile` and is SENSITIVE: self projection only, never analytics.
2. **`first_name` nullability.** DATA-MODEL marks it required; the column is nullable because the profile row may precede the NAME step (reviewed in B1.3). The NAME completion rule enforces it.
3. **PATCH account states.** "Self + allowed account state" = ACTIVE or PENDING_VERIFICATION, consistent with B1; everything else fails closed. Protected and unknown fields are rejected, not ignored.
4. **Name moderation.** O01's "obvious offensive/spam text flagged" requires moderation infrastructure that does not exist yet; validation rules (no URLs, digits, emoji-only names) are enforced and flagging is deferred.
5. **Age in `/users/me`.** Whole years at the same UTC−12 reference as the age gate, so a displayed age never runs ahead of the true age. The date of birth never leaves the identity module.

---

## B3-V1 — Visual Identity V1 (supersedes B2-D5 provisional colours)

**APPROVED 2026-10-04.** Mockups: the B3 design canvas (Visual Identity V1 sheet, component states, A01–O03 screens).

- **Palette:** Connect Indigo (500 `#5B55E7` core brand, 600 `#4F46C8` action, 700 pressed), coral accent (never the primary action), community teal (sparingly), cool neutrals, background `#FBFAFD`. The B2 provisional palette is replaced.
- **Accessibility adjustments** (adjust the primitive, never the standard): field/selection borders use neutral 500 `#7D7D88` (neutral 300 failed 3:1); small text uses neutral 600 `#62626E`, with neutral 500 kept for muted/large/disabled text only; dark-mode brand `#8A84F2` carries dark text; error text on tints is `#A93232` and the dark-mode error border is `#E06666`. `tokens.test.ts` enforces every rendered pair.
- **Typography:** system fonts only (SF Pro / Roboto). No font package in B3.
- **Logo:** the "Connect Loop" mark is a **provisional** brand mark, drawn with native views (no SVG dependency). "Project Connect" remains a working name. A name/logo exercise precedes production app-store assets.
- **Imagery:** abstract connection geometry for B3. Approved editorial illustration or photography comes later.
- **Progress:** no progress indicator on early onboarding screens (back arrow + content only) until the full onboarding journey is designed. No counts or percentages.
- **Screen 8:** a temporary continuation/holding screen ("Great start."), not Location.
- **Shared UI:** `packages/ui` (Screen, AppText, Button, TextField, PhoneField, OtpInput, SelectionRow, InlineMessage, AppLogo, BackButton, LoadingIndicator) consumes `packages/design-tokens`. `apps/mobile/src/ui` was removed. The raw-colour architecture rule now also covers `packages/ui/src`.

## B3-C1 — Screen copy diverges from SCREEN-FUNCTIONAL-SPEC (explicit)

The approved V1 layouts change some SFS copy. These are recorded divergences until SFS is revised:

| Screen | SFS | B3 (approved) |
|---|---|---|
| A02 hero | "Find your people nearby." | "Find your people, wherever you are." |
| A02 supporting | "Meet verified members of the Indian diaspora for friendship, activities, community, events, networking, and dating." | "Meet people nearby for friendship, activities, community and more." |
| A02 CTAs | "Get Started" / "I Already Have an Account" | "Get started" / "Already a member? Sign in" |
| A03 under-18 | "You must be 18 or older to use Project Connect." | "Project Connect is for adults 18+" / "You need to be at least 18 years old to create an account." + "Back to welcome" |

## B3-C2 — Terms / Privacy acknowledgement

**APPROVED (wording pending counsel).** Welcome shows: "By continuing, you agree to our Terms of Service and acknowledge our Privacy Policy." The links are tappable (`EXPO_PUBLIC_TERMS_URL` / `EXPO_PUBLIC_PRIVACY_URL`; until they are set, a notice explains the documents arrive before launch). There is no checkbox unless legal requires one.

- **Acceptance is recorded by the server at registration** (Terms version + timestamp; Privacy acknowledgement as appropriate), never inferred from viewing a screen. **Backend follow-up:** this needs a schema/migration plan and review; it is not implemented in B3.

## B3-C3 — Client age gate and DOB handling

- A03 mirrors the server rule (BR-AUTH-001, UTC−12 reference date, 1900 floor, Feb 29 handling) for UX only. The server decides eligibility at registration.
- The DOB is held in memory only (`registrationDraft`) until registration. It is never persisted, logged or sent to analytics. An under-age result clears it and replaces the route, so Back cannot return to a filled form.
- Mobile analytics events (`welcome_viewed`, `age_gate_completed {eligible}`, …) are **not emitted yet**: no mobile `AnalyticsProvider` exists. They are deferred to the analytics slice.

---

## B4.1 — Location (O03): manual city selection

**APPROVED 2026-10-05** by the project owner. Migration `0001_location_foundation` (metros, cities, user_locations + reviewed seed).

### B4.1-D1 — Initial DFW city taxonomy

PRD §19 names Frisco, Plano, Irving and Dallas as **illustrative** public-location examples; it is not an exhaustive list. The owner-approved initial taxonomy for B4.1 is these 14 DFW localities:

> Dallas, Fort Worth, Arlington, Frisco, Plano, Irving, McKinney, Allen, Richardson, Carrollton, Coppell, Prosper, Denton, Lewisville

All are `metro = DFW`, `state_region = TX`, `country_code = US`, `launch_status = ACTIVE`. The DFW metro is `Dallas–Fort Worth`, `US`, `America/Chicago`, `ACTIVE`. This is seed data only; DFW is never encoded in constraints or application invariants (DATA-MODEL §126). Further cities require owner approval and a separate reviewed data migration. This is not a national city database.

### B4.1-D2 — Manual city only; explicit divergence from SFS O03

**Deliberate narrowing of SFS O03.** SFS O03 shows "Use My Location" as the primary action with manual choice as the secondary one. B4.1 implements **manual city selection only**:

- no GPS, no OS location-permission prompt, no map, no neighborhood field, no geocoding or external location provider, no IP inference;
- `user_locations.precision_type = MANUAL_CITY`, `source = MANUAL` (the CHECK constraints allow only these values in this slice).

BR-LOC-003 (GPS optional; manual choice must allow product use) is satisfied. Device location returns as an approved, contextual permission flow when discovery distance needs it.

### B4.1-D3 — Location write ordering

Location is never collected early (data minimisation, predictable ordering):

| Onboarding step at write time | `PATCH /api/v1/users/me/location` |
|---|---|
| before LOCATION (NAME, GENDER) | rejected `409 ONBOARDING_STEP_NOT_REACHED`; nothing stored |
| LOCATION | saved; LOCATION → INTENT in the same transaction |
| INTENT or later, including COMPLETE | saved (city edit); onboarding never rewinds |

The location module writes `user_locations`; identity alone writes `users.onboarding_*` via `OnboardingProgressService`, inside one UnitOfWork transaction that row-locks the user (same pattern as B2-D1). `onboarding_step_completed {step_code: LOCATION}` is emitted after commit only, once; the city never enters analytics.

### B4.1-D4 — Users outside the approved cities

For invite-only Cohort 1, only approved DFW cities can complete Location. The screen says "Can't find your city? We're starting in Dallas–Fort Worth and expanding soon." There is no fake city, no "Other" value, no free-text city, no IP inference and no waitlist table. Such users cannot advance and no location data is stored. A real expansion/waitlist workflow (BR-LOC-006) is a later, separately approved slice.

### B4.1-D5 — Schema departures from DATA-MODEL §21–23

| Departure | Resolution |
|---|---|
| No `active` boolean on metros/cities | `launch_status` (ACTIVE/WAITLIST/FUTURE/DISABLED) is the single availability source; a second flag could disagree. |
| No city centroid coordinates | Added by additive migration with a concrete discovery-distance implementation. |
| `country_code varchar(2)` + `^[A-Z]{2}$` CHECK | Instead of padded `CHAR(2)`. |
| No `latitude`/`longitude` on `user_locations` | B4.1 collects none. Coordinates (and a geography point, if justified) arrive with GPS through a reviewed additive migration. |
| No `(metro_id, city_id)` or spatial index | Added with discovery queries and their plans. |

**Integrity:** composite foreign keys make a mismatched metro or country unrepresentable: `user_locations (city_id, metro_id, country_code) → cities (id, metro_id, country_code)` and `cities (metro_id, country_code) → metros (id, country_code)`. `user_locations.user_id` is the primary key: one current row per user, overwritten in place, never a history (ADR-057, DATA-MODEL §87).

### B4.1-D6 — API

- `GET /api/v1/locations/cities` (authenticated): ACTIVE cities in ACTIVE metros, by name, as `{ id, name, stateRegion, countryCode, metro: { id, code, name }, launchStatus }`. No coordinates, timezone or neighborhood. The list is a small bounded taxonomy, so it is returned whole (not cursor-paginated) and the client filters locally; it is not a people or geocoding search (ADR-045).
- `PATCH /api/v1/users/me/location` accepts exactly `{ cityId }`; metro, country, precision and source are server-derived and any other field is `400 VALIDATION_FAILED`. Unknown and non-selectable cities are both `422 CITY_NOT_AVAILABLE`. Allowed for ACTIVE and PENDING_VERIFICATION accounts (guard default). Re-sending the same city is naturally idempotent (state-setting overwrite), so no Idempotency-Key is required.
- Response: `{ location: { city }, onboarding: { status, step } }`. `GET /users/me` does not yet include the location; the Location screen does not pre-select a previously saved city. _(Superseded by B4.2A-D6: `/users/me` now returns `location` and the screen pre-selects it.)_

### B4.1-D7 — Holding screen

The B3 "Great start." holding screen now sits at **INTENT** (after Location) until B4.2, with copy updated to "Your basics and city are saved." Copy is provisional pending visual review.

### B4.1-D8 — Review follow-ups

- **Account status re-checked under the user row lock.** `OnboardingProgressService.lockForProfileUpdate` now fails closed (`403 ACCOUNT_NOT_ACTIVE`) unless the locked account is ACTIVE or PENDING_VERIFICATION. A restriction that commits after request authentication therefore still blocks the write. This tightens the existing B2 profile write path as well as the new location path.
- **Deletion (open, not in B4.1).** `user_locations.user_id → users` is `ON DELETE NO ACTION`. The future deletion orchestrator (ADR-056) must purge `user_locations` explicitly; record this when that slice is designed.
- **Save-failure handling (found in device validation).** A failed location save no longer waits on, or replaces, the loaded city list. The list is refreshed in the background only on `CITY_NOT_AVAILABLE`. A failed background refetch keeps the last good list (and selection) visible; the load-error state with "Try again" appears only when no list has ever loaded.

### B4.1 — Android validation (2026-10-05)

**COMPLETE.** Pixel 9 Pro XL emulator, Expo Go, local API:

1. Resuming an account parked at LOCATION opens Location directly.
2. While searching, the selected city stays visible and checked.
3. Choosing a city advances to the INTENT holding screen; the stored row is `MANUAL_CITY` / `MANUAL` / DFW.
4. Back and a cold relaunch stay at INTENT (no regression).
5. A no-match search shows "No matching cities." and dispatches a `TYPE_ANNOUNCEMENT` accessibility event.
6. Load-error and "Try again" states render and recover once the API returns; a withdrawn city returns `CITY_NOT_AVAILABLE`, refreshes the list and clears the selection.
7. At font scale 2.0, the heading, city rows, notes, privacy caption, Continue and the holding screen are unclipped.
8. TalkBack semantics: labelled search field; city rows expose the radio role with checked state; buttons expose enabled/busy state. Spoken output was not audibly verified (adb cannot drive TalkBack gestures); a hands-on TalkBack pass remains advisable before release. iOS VoiceOver: pending (no macOS device).

---

## B4.2A — Intent + explicit Dating opt-in (O04/O05)

**APPROVED 2026-10-06** by the project owner. Migration `0002_intent_dating_foundation` (intent_options, user_intents, dating_consents + reviewed intent seed).

### B4.2A-D1 — Dating kill switch

Dating is implemented but **OFF by default in every environment** (ADR-094, ADR-032, T&S §190 release gate).

- `DATING_ENABLED=false` (default) → DATING is absent from `GET /profile/intents`, `PUT /users/me/dating/consent` returns `403 DATING_NOT_ELIGIBLE`, and `DELETE` still works.
- `DATING_ENABLED=true` may be set **deliberately** in local/staging to test. It requires `DATING_POLICY_VERSION`; config validation refuses a missing version, and refuses any version containing "draft" when `NODE_ENV=production`.
- `DATING_ENABLED` is the only source of the bootstrap `dating_enabled` flag; setting it through `FEATURE_FLAGS` is rejected.
- Production stays `DATING_ENABLED=false` until legal, product and safety approve a real policy version (e.g. `dating-2026-XX-v1`). The local/staging test version is `dating-draft-2026-10-v0`, held in configuration, never in seed data.
- Not yet enforced: the `USE_DATING` capability restriction (`user_restrictions` is not built). Add it to opt-in when restrictions exist.

### B4.2A-D2 — Consent semantics and invariant

- `dating_consents` is append-only evidence that the user **affirmatively accepted the currently configured dating policy version**. It is not proof that the user read or viewed the text. Opt-in inserts a row; withdrawal sets `revoked_at`; history is retained per the approved retention policy. No IP or device metadata.
- Invariant: **active DATING intent ⇔ exactly one active (unrevoked) consent.** Revoked historical consents may coexist with an inactive DATING. The partial unique index enforces at most one active consent; the cross-table invariant is held by the dating module (both writes in one transaction under the user row lock) and proven by unit and integration tests, including failure-injection and race tests.
- Opting in to a newer policy version revokes the older active consent and records a new one.

### B4.2A-D3 — Ownership

Profile owns `intent_options` and `user_intents` and handles the social intents. The dating module owns `dating_consents` and is the **only** writer of the DATING intent (through profile's `DatingIntentWriter`). This avoids a profile↔dating dependency cycle and keeps the invariant in one place.

### B4.2A-D4 — API (supersedes the original SFS O05 endpoint)

- `GET /api/v1/profile/intents` — active top-level options in display order, plus `dating: { policyVersion }` only while enabled. Sub-intents (CASUAL_DATING, SERIOUS_RELATIONSHIP) are seeded reference data only: not exposed, selectable or used.
- `PUT /api/v1/users/me/intents` `{ intents: [FRIENDSHIP|ACTIVITIES|NETWORKING…] }` — replace semantics for the non-dating intents; DATING in the body is `400`. At least one active intent overall (DATING counts) or `422 INTENT_REQUIRED`. Deselected rows are kept inactive.
- `PUT /api/v1/users/me/dating/consent` `{ policyVersion }` — must equal the served version (`409 DATING_POLICY_OUTDATED`); source ONBOARDING until onboarding is complete, then SETTINGS; idempotent. Response `{ datingEnabled: true }` only.
- `DELETE /api/v1/users/me/dating/consent` — `204`, idempotent, **never blocked**: not by the kill switch, the onboarding step, account status (it allows any authenticated account, like logout) or the intent minimum.

### B4.2A-D5 — Progression and withdrawal

| Step at write time | Intents / consent |
|---|---|
| before INTENT | `409 ONBOARDING_STEP_NOT_REACHED`; nothing stored (withdrawal excepted) |
| INTENT | intent save with ≥1 active intent → INTENT → LANGUAGE in the same transaction |
| after INTENT | edits allowed, never rewind |

Withdrawing Dating when it is the only intent is allowed: zero active intents, onboarding not rewound, nothing auto-selected. The profile is then incomplete (BR-INT-001); onboarding completion (later) must require ≥1 active intent again. Ordinary intent edits can never reach zero.

Every write except withdrawal re-checks account status under the user row lock (B4.1-D8).

### B4.2A-D6 — Self projection

`GET /users/me` adds `location` (city/metro), `activeIntents` (top-level) and `datingEnabled` (derived from the DATING intent, which the invariant ties to an active consent). These are **self-only**; `datingEnabled` must never appear on public or general profile DTOs (BR-DATE-008). Policy version, consent timestamps, source and history are never returned. Location and Intent now pre-select saved choices.

### B4.2A-D7 — Analytics

`onboarding_step_completed {step_code: INTENT}`, `dating_enabled {source: onboarding|settings}` and `dating_disabled`, emitted after commit and only on an actual state change. No intent codes, policy versions or consent times enter analytics. `intent_selected` (SFS) is not a registry event and is not emitted.

### B4.2A-D8 — Screens

- O04: four neutral multi-select cards (label + description from `intent_options.description`), using the new shared `CheckboxRow` (checkbox role; checked shown by border, tint, weight and a check mark). Dating has no special colour or icon. Selecting Dating opens O05; deselecting it withdraws immediately.
- O05: "Dating is optional" with a deliberate **Opt in to dating** button (replacing the SFS checkbox) and **Not now**. SFS O04/O05 were revised accordingly.
- The holding screen now sits at LANGUAGE until B4.2B.

### B4.2A-D9 — Review follow-ups

- **Withdrawal under clock skew.** `revoked_at` and `deselected_at` are written as `GREATEST(now, consented_at/selected_at)`, so a withdrawal handled by a server whose clock is behind can never violate the ordering CHECKs and fail (integration-tested).
- **Accessibility.** The O04 list has a list role; the Dating row reports busy while turning off and announces "Dating turned off"; O05 has loading and retry states and disables Back while the opt-in is in flight. O04 shows the approved line "You control which types of connections you appear in." The holding screen copy reverts to the B3 "Your profile basics are saved." now that it follows Intent.
- **Release gate for enabling Dating anywhere beyond local/staging testing** (added to T&S §190 scope, not built in B4.2A):
  1. O05 must show or link the actual dating policy text for the version being accepted.
  2. Turning the kill switch off does **not** revoke existing opt-ins. Every future dating surface (discovery, connection reasons, dating events) must require `DATING_ENABLED` **and** the user's dating state, with an acceptance test that switch-off plus an existing consent yields zero dating exposure. Whether switch-off should also suspend existing participation is a product/safety decision to confirm then.
  3. The `USE_DATING` capability restriction must be enforced on opt-in once `user_restrictions` exists.
  4. While the switch is off, an active DATING still counts toward the one-intent minimum; revisit with onboarding completion.

### B4.2A — Status

**COMPLETE** (owner sign-off 2026-10-06). Commit `fe70faa`. Migration `0002_intent_dating_foundation`.

Done: schema/migration, intent API, explicit Dating consent API, server kill switch, self projection, Intent and Dating opt-in screens, concurrency/invariant tests, security/T&S/accessibility review, Android runtime validation, OpenAPI/check/unit/integration/e2e green.

Deferred, and **release blockers** before `DATING_ENABLED=true` in any real environment (not technical debt): the real dating legal policy and its link on O05, downstream kill-switch enforcement in every dating surface, and the `USE_DATING` restriction. Also deferred: dating preferences and sub-intents UI, dating discovery, an iOS VoiceOver pass and a hands-on TalkBack speech check.

---

## B4.2B — Languages + Interests (O06/O07)

**APPROVED 2026-10-06** by the project owner. Migration `0003_languages_interests_foundation` (languages, user_languages, interest_categories, interests, user_interests + reviewed seed).

### B4.2B-D1 — Taxonomy

- **Languages (12):** the PRD §17 / SFS O06 set, in **SFS display order** (screen behaviour is SFS-governed): English, Telugu, Tamil, Kannada, Hindi, Malayalam, Gujarati, Punjabi, Bengali, Marathi, Urdu, Odia. Codes are ISO 639-1 (`en te ta kn hi ml gu pa bn mr ur or`).
- **Interests:** the 6 DATA-MODEL §15 / PRD §18 categories and exactly the 38 PRD §18 interests with stable UPPER_SNAKE codes. Presentation-only label cleanups (codes unchanged): **Gym & fitness**, **Temples & cultural events**, **Stand-up comedy**. These labels appear only in PRD §18; SFS O07 defers to the PRD taxonomy.
- Deferred (additive later, no guessed data): `languages.native_name`, `interests.icon_key`, language proficiency. No discovery indexes and no selection history.

### B4.2B-D2 — API and rules

- `GET /api/v1/profile/languages`, `GET /api/v1/profile/interests` (categories with interests), by **code**; internal interest UUIDs never leave the server.
- `PUT /api/v1/users/me/languages` `{ languages: [codes] }` and `PUT /api/v1/users/me/interests` `{ interests: [codes] }`: full-set replace. **Atomic:** any unknown or inactive code fails the whole save (`400 VALIDATION_FAILED`, issue `language_not_available` / `interest_not_available`) and the previous selection is unchanged.
- **At least 1 language and at least 3 interests on every save**, including later edits. There is no business maximum (the contracts carry only payload bounds). Unlike Dating withdrawal there is no user-control exception, so the client cannot create an invalid profile.
- Progression uses a generic identity step rule (`assertStepReached` / `recordStepProgress`): rejected before the step (`409 ONBOARDING_STEP_NOT_REACHED`); LANGUAGE → INTERESTS and INTERESTS → PHOTO in the save transaction, under the user lock with the account re-check; later edits never rewind. `onboarding_step_completed` after commit only. `interest_selected` / `onboarding_interest_count` (SFS) are not registry events and are not emitted.
- `/users/me` adds `languages: [{ code, displayName }]` and `interests: [{ code, label, categoryCode }]` (self-only, restores O06/O07 selection).

### B4.2B-D3 — Screens

- O06: "Which languages do you speak? / Choose all that apply." Searchable list of `CheckboxRow`s; English first.
- O07: category sections of the new shared **`SelectableChip`** (checkbox role and checked state, ≥44pt target, grows with text, selected shown by border, tint, weight and a view-drawn check, never colour alone; the `action.primary on surface.selected` pair is already contrast-tested). A live "N selected · choose N more" counter sits by Continue, which is disabled below 3. The O07 heading copy ("What are you into?") is provisional pending visual review.
- The holding screen now sits at PHOTO ("Next, you'll add a profile photo.").
