# Specification Reconciliation Record

| Field | Value |
|---|---|
| Status | **APPROVED — implementation detail companion to [GOVERNANCE-RESOLUTIONS-V1.1.md](GOVERNANCE-RESOLUTIONS-V1.1.md)** |
| Date | 2026-10-04 |
| Approved by | Project owner |
| Scope | Detailed resolution text and schema specifics for the conflicts found between `CLAUDE.md` and `docs/` before product code begins |

## Authority

**[GOVERNANCE-RESOLUTIONS-V1.1.md](GOVERNANCE-RESOLUTIONS-V1.1.md) is the single authoritative decision register.** Both records encode the same owner decisions. This document carries the detailed wording, field lists and examples that the inline amendment notes across `docs/` cite as `R-xx`. If the two ever diverge, **the GR entry governs** and this document must be corrected.

| This record | Authoritative entry | Topic |
|---|---|---|
| R-00 | GR-003 | Specificity rule / canonical authority by domain |
| R-01 | GR-001 | Approval boundary |
| R-02 | GR-002 | Root CLAUDE.md vs constitution |
| R-03 | GR-004 | Analytics event names |
| R-04 | GR-005 | Messaging write path (ADR-008) |
| R-05 | GR-006 | Supporting technology ratification |
| R-06 | GR-007 | API namespaces |
| R-07 | GR-008 | Staff MFA |
| R-08 | GR-009 | Meaningful Connection / North Star |
| R-09 | GR-010 | Activation |
| R-10 | GR-011 | Data-model additions |
| R-11 | GR-012 | Native Windows development |
| R-12 | GR-013 | Default branch `main` |
| R-13, R-14 | GR-014 | ADR storage and numbering |
| R-15 | GR-015 | Notification filename |
| R-16 | GR-016 | Connection request states |
| R-17 | GR-017 | RSVP states |
| R-18 | GR-018 | Restricted screen P20 |
| R-19 | GR-019 | Generic analytics events |
| R-20 | GR-020 | Neighborhood |
| R-21 | GR-021 | Profile visitor insights |
| R-22 | GR-022 | Marketing consent |
| R-23 | GR-023 | Design-token structure |
| — | GR-024 | ADR pack is the accepted architecture baseline |
| — | GR-025 | Control package contains eight skills |

Where an earlier document conflicts with a resolution, **the resolution governs**. Affected documents carry an inline amendment note pointing here. Original decision text (for example the ADR pack) is preserved rather than rewritten.

---

## R-00 — Specificity rule (source-of-truth refinement)

When two approved documents address the same topic, the document designated as canonical for that domain governs that topic, even if a broader document ranks higher in the general hierarchy.

| Domain | Canonical document |
|---|---|
| Product scope | `docs/product/PRODUCT-REQUIREMENTS.md` |
| Screen / user interaction | `docs/product/SCREEN-FUNCTIONAL-SPEC.md` |
| Business states and rules | `docs/product/BUSINESS-RULES.md` |
| Data structure | `docs/architecture/DATA-MODEL.md` |
| Authorization | `docs/architecture/AUTHORIZATION.md` |
| Trust & Safety | `docs/safety/TRUST-SAFETY.md` |
| Notification delivery, copy, channels | `docs/operations/NOTIFICATIONS.md` |
| Analytics event names and metric definitions | `docs/analytics/ANALYTICS-SPEC.md` |
| Visual design | `docs/design/DESIGN-SYSTEM.md` |
| Technical architecture | Accepted ADRs (`docs/architecture/adr/`) |
| Claude operating behavior | `CLAUDE.md` + `docs/architecture/CLAUDE-ENGINEERING-CONSTITUTION.md` |

The general hierarchy in `CLAUDE.md` still applies when no domain-canonical document governs the topic. This record overrides all of the above for the topics it resolves.

---

## R-01 — Approval policy (stricter rule wins)

Human approval is required before Claude:

1. installs or removes **any** package (not only high-risk packages);
2. makes a material lockfile change caused by dependency changes;
3. runs external network commands against third-party services, unless the operation is an explicitly approved read-only/documentation operation;
4. performs destructive file operations;
5. runs Terraform apply/destroy, mutates cloud resources, deploys, or accesses production, secrets, or production data (always);
6. **writes** a production-impacting schema migration. Planning and reviewing a migration needs no approval.

Supersedes the narrower wording in the former root `CLAUDE.md` §33/§47 (now `CLAUDE-OPERATING-CONTRACT.md`).

## R-02 — Instruction layering

| Layer | File | Purpose |
|---|---|---|
| Always-on | `CLAUDE.md` (root) | Short master operating contract |
| Scoped | `.claude/rules/*.md` | Path-scoped technical rules |
| Full reference | `docs/architecture/CLAUDE-ENGINEERING-CONSTITUTION.md` | Full engineering governance |
| Full reference | `docs/architecture/CLAUDE-OPERATING-CONTRACT.md` | Former 1,424-line root `CLAUDE.md`, preserved verbatim |

## R-03 — Canonical analytics event names

The Analytics Spec is canonical for event names (R-00). Legacy names are superseded terminology, **not additional events. Never emit both.**

| Superseded name | Canonical name |
|---|---|
| `event_rsvp` | `event_rsvp_created` |
| `event_cancel_rsvp` | `event_rsvp_cancelled` |
| `chat_opened` | `conversation_opened` |
| `subscription_viewed` | `paywall_viewed` |
| `phone_verified` | `otp_verified` |
| `age_gate_passed` / `age_gate_failed` | `age_gate_completed` with property `eligible` |
| `notification_push_attempted` | `push_attempted` |

## R-04 — Messaging write path (ADR-008 wins)

```text
Mobile
→ POST /api/v1/conversations/{id}/messages
→ Authenticate → Authorize → Persist (PostgreSQL) → Commit
→ Outbox / realtime publish
→ WebSocket delivery (push fallback when offline)
```

WebSocket is delivery transport only, never the authoritative write path. The Screen Spec M02 wording "WebSocket/realtime recommended. POST fallback." is superseded.

## R-05 — Ratified supporting technologies

Approved now as part of the V1 supporting stack (ADR coverage to follow):

| Area | Technology | Constraint |
|---|---|---|
| Persistence | Drizzle ORM | PostgreSQL remains authoritative; raw parameterized SQL allowed for PostGIS/performance-sensitive queries; Drizzle never imported by the domain layer |
| Push | Firebase Cloud Messaging (FCM) | Initial provider behind `PushProvider` only. This does not make Firebase a backend or database. |
| Scheduling | Amazon EventBridge Scheduler | Event reminders and scheduled jobs where appropriate |
| Testing | Vitest | TypeScript unit/domain tests |
| Testing | Maestro | Critical mobile E2E |
| Observability | OpenTelemetry, Amazon CloudWatch, Sentry | — |

## R-06 — API namespaces (frozen)

| Surface | Prefix |
|---|---|
| Consumer API | `/api/v1/*` |
| Admin API | `/admin/v1/*` |

Examples: `POST /api/v1/connections/requests`, `POST /api/v1/connections/requests/{id}/accept`, `GET /api/v1/events`, `POST /api/v1/events/{id}/rsvp`, `GET /admin/v1/reports`, `POST /admin/v1/reports/{id}/actions`.

Endpoint paths in other documents written without a prefix are relative to these namespaces. ADR-003's `/connection-requests/{id}/accept` was illustrative; the canonical path is `/api/v1/connections/requests/{id}/accept`. AUTHORIZATION.md's `/admin/*` means `/admin/v1/*`.

## R-07 — Staff MFA mandatory

All staff production access requires MFA: `SUPPORT_AGENT`, `MODERATOR`, `EVENT_MANAGER`, `SUPER_ADMIN`. Screen Spec ADM01 "strongly recommended" is superseded.

## R-08 — Meaningful Connection (frozen formula)

A connection becomes meaningful when:

1. a connection request has been accepted;
2. at least one participant sends a persisted message;
3. the other participant sends a persisted reciprocal message;
4. the reciprocal exchange occurs within 7 days of connection acceptance;
5. it is counted only once per connection relationship.

Canonical derived event: `meaningful_connection_created`.

| Metric | Definition |
|---|---|
| **North Star** | Weekly Meaningful Connections Created |
| Normalized network-quality KPI | Meaningful Connections / WAU |
| Sustained conversation (separate metric) | ≥10 total messages from both participants within 7 days of acceptance |

## R-09 — Activation (PRD definition wins)

Activated requires all of:

1. completed registration;
2. verified phone;
3. profile completeness ≥70%;
4. ≥1 intent;
5. ≥3 interests;
6. discovery viewed;
7. at least one of: connection request sent, or event RSVP created.

Accepting an incoming request does **not** independently satisfy activation.

## R-10 — Data-model additions (approved)

Added to the canonical implementation model; see the amendment section in `DATA-MODEL.md`.

- `user_sessions`: `id`, `user_id`, `refresh_token_hash`, `token_family_id`, `device_context`, `created_at`, `last_used_at`, `expires_at`, `revoked_at`, `revocation_reason`. Supports rotation, replay detection, revocation, logout-all-devices.
- `user_restrictions`: structured capability restrictions, not boolean columns on `users`. Capabilities: `DISCOVER`, `BE_DISCOVERED`, `SEND_REQUESTS`, `RECEIVE_REQUESTS`, `MESSAGE`, `RSVP`, `USE_DATING`. Fields: capability, enabled/disabled, reason, source, `expires_at`, `created_at`.
- `moderation_appeals`: `id`, `user_id`, `moderation_action_id`, `submitted_at`, `status`, `resolution`, `reviewer_admin_id`, `resolved_at`, `reason_code`. User free text, if allowed, is protected as sensitive.
- `notification_deliveries`: per-channel attempts/results.
- Notification preferences gain `quiet_hours_enabled`, `quiet_hours_start`, `quiet_hours_end`, `timezone`, `message_preview_enabled`.
- `SUPPORT_AGENT` is an approved staff role.

## R-11 — Native Windows development supported

The repository stays at its current location. Native Windows development is supported; WSL2 is recommended but optional. Claude hooks must be cross-platform Node scripts (`.claude/hooks/*.mjs`), not Bash-only scripts.

## R-12 — Default branch is `main`

Local branch renamed `master` → `main` on 2026-10-04. Remote default-branch configuration is handled separately before the first push.

## R-13 — ADR storage

`docs/architecture/adr/ADR-PACK.md` remains the preserved, authoritative approved source. Individual files `ADR-001-*.md` … `ADR-100-*.md` are exact extracts for usability, indexed by `docs/architecture/adr/README.md`. If an extract ever differs from the pack, the pack wins.

## R-14 — ADR numbering

Where `SYSTEM-ARCHITECTURE.md` (§190, §217 preliminary lists) and `ADR-PACK.md` disagree on an ADR number or title, the accepted `ADR-PACK.md` wins.

## R-15 — Notification spec filename

Canonical path: `docs/operations/NOTIFICATIONS.md`. References to `NOTIFICATION-SPEC.md` are normalized to it.

## R-16 — Connection request states

Canonical persisted states: `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `CANCELLED`, `INVALIDATED`.

`BLOCKED` is not a request lifecycle state. A block transitions `PENDING → INVALIDATED` with internal `invalidation_reason = BLOCK`.

## R-17 — RSVP states

Canonical persisted states: `GOING`, `WAITLISTED`, `CANCELLED`. "Not Going" is a UI concept: a user with no active RSVP is not going.

## R-18 — Screen reference correction

Suspended/restricted users route to **P20 Account Restricted**. P18 remains Delete Account.

## R-19 — No generic analytics substitutes

`screen_viewed` / `cta_tapped` must not substitute for semantic product events from the analytics catalog. Any future low-level UI telemetry needs separate governance and never replaces canonical events.

## R-20 — Neighborhood not exposed

The V1 consumer location projection is metro, city, and approved rounded distance only. Current neighborhood is not exposed unless separately privacy-approved. A user-entered hometown/descriptive field is distinct from current discovery location.

## R-21 — No profile visitor insights in V1

Not implemented until a separate product/privacy decision is approved.

## R-22 — Marketing consent

Marketing requires affirmative user consent (no marketing until consent) and remains fully opt-out/revocable at any time.

## R-23 — Design-token package structure

Canonical: `packages/design-tokens/` and `packages/ui/`. `packages/ui` consumes `@project-connect/design-tokens` and never duplicates a second `tokens/` implementation.

---

## Follow-ups

- Write formal ADRs for the R-05 technologies and for R-06 namespaces.
- Configure the remote default branch as `main` before first push (R-12).
