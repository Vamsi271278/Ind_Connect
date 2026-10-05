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
