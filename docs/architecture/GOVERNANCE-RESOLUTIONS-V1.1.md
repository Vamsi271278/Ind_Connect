# Project Connect — Governance Resolutions V1.1

## Status
**APPROVED IMPLEMENTATION BASELINE**

## Purpose
This document resolves cross-document ambiguities discovered during the pre-code read-only governance audit.

It does not rewrite the historical approved artifacts. It records authoritative implementation resolutions until those artifacts are formally revised.

---

## GR-001 — Approval Boundary

**Decision:** Use the stricter approval model.

Human approval is required before:
- any package installation, removal or dependency upgrade;
- material dependency-driven lockfile changes;
- production-impacting migration creation;
- external network/service commands unless explicitly approved as safe/read-only;
- destructive file operations;
- cloud mutation;
- Terraform apply/destroy;
- deployment;
- protected-branch push;
- secret access;
- production-data access;
- production migration execution.

Planning/reviewing these actions is allowed.

---

## GR-002 — Root CLAUDE.md vs Engineering Constitution

**Decision:** Root `CLAUDE.md` is the concise always-on contract.

The long-form governance document remains:
`docs/architecture/CLAUDE-ENGINEERING-CONSTITUTION.md`.

Scoped implementation guidance belongs in `.claude/rules/`, `.claude/skills/`, `.claude/agents/`, hooks and CI.

---

## GR-003 — Canonical Authority by Domain

Use the most specific approved authority for the subject:

- Product scope → PRD
- Screen behavior → Screen Functional Specification
- Business states/eligibility → Business Rules
- Data structure → Data Model
- Authorization → Authorization Specification
- Trust & Safety → Trust & Safety Specification
- Notifications → Notification Specification
- Analytics taxonomy/KPIs → Analytics Specification
- Visual design/accessibility → Design System
- Technical architecture → Accepted ADRs
- Claude behavior → CLAUDE.md + Engineering Constitution

Accepted ADRs remain authoritative for architecture. Product/business requirements do not silently supersede an ADR.

---

## GR-004 — Analytics Event Names

**Decision:** Analytics Specification is canonical.

Canonical names:
- `event_rsvp_created`
- `event_rsvp_cancelled`
- `conversation_opened`
- `paywall_viewed`
- `otp_verified`
- `age_gate_completed` with `eligible`
- `push_attempted`

Legacy aliases in broader documents are superseded and must not be emitted in parallel.

---

## GR-005 — Messaging Write Architecture

**Decision:** ADR-008 is canonical.

Message creation uses REST and durable persistence.

WebSocket is realtime delivery transport.

Canonical sequence:
REST mutation → authorize → persist → commit → publish → WebSocket/push delivery.

---

## GR-006 — Supporting Technology Ratification

Approved V1 supporting technologies:
- Drizzle ORM
- Firebase Cloud Messaging behind `PushProvider`
- Amazon EventBridge Scheduler where appropriate
- Vitest
- Maestro
- OpenTelemetry
- Amazon CloudWatch
- Sentry

FCM is push transport and does not violate the prohibition on Firebase as the primary backend/database.

---

## GR-007 — API Namespaces

Canonical:
- Consumer: `/api/v1/*`
- Admin: `/admin/v1/*`

Canonical connection acceptance:
`POST /api/v1/connections/requests/{id}/accept`

Older unprefixed endpoint examples are illustrative only.

---

## GR-008 — Staff MFA

All staff production access requires MFA.

Applies to:
- Support Agent
- Moderator
- Event Manager
- Super Admin

---

## GR-009 — Meaningful Connection

A connection becomes meaningful when:
1. connection is accepted;
2. at least one participant sends a persisted message;
3. the other participant sends a persisted reciprocal message;
4. reciprocal exchange occurs within 7 days of acceptance;
5. relationship is counted once.

Canonical event:
`meaningful_connection_created`

Primary North Star:
**Weekly Meaningful Connections Created**

Normalized network-health KPI:
**Meaningful Connections / WAU**

Sustained Conversation remains a separate >=10-message/both-users/7-day metric.

---

## GR-010 — Activation

Canonical activation requires:
1. registration complete;
2. phone verified;
3. profile completeness >=70%;
4. >=1 intent;
5. >=3 interests;
6. discovery viewed;
7. at least one connection request **sent** OR event RSVP created.

Accepting an incoming request alone does not satisfy item 7.

---

## GR-011 — Approved Data-Model Additions

Approved model additions:
- `user_sessions`
- `user_restrictions`
- `moderation_appeals`
- `notification_deliveries`
- quiet-hours/timezone/message-preview preference fields
- `SUPPORT_AGENT` staff role

Restrictions should use an auditable capability-oriented model rather than accumulating permanent boolean columns on `users`.

Actual schema still requires migration review.

---

## GR-012 — Development OS

Native Windows development is supported.

WSL2 is recommended/optional, not mandatory.

Repository location `D:\\project-connect` is acceptable.

Cross-platform Node hooks are preferred over mandatory Bash-only hooks.

---

## GR-013 — Git Branch

Canonical default branch is:
`main`

Repositories still using `master` should rename before feature development.

---

## GR-014 — ADR Storage and Numbering

The approved `ADR-PACK.md` is the historical authoritative pack.

Individual ADR files may be extracted verbatim for usability.

If older System Architecture text disagrees with ADR numbering/title, the accepted ADR Pack wins.

---

## GR-015 — Notification Filename

Canonical repository filename:
`docs/operations/NOTIFICATIONS.md`

References should point to this path.

---

## GR-016 — Connection Request State

Canonical persistent states:
- PENDING
- ACCEPTED
- DECLINED
- EXPIRED
- CANCELLED
- INVALIDATED

A block invalidates the affected pending request; `BLOCKED` is not a normal request lifecycle state.

---

## GR-017 — RSVP State

Canonical persistent states:
- GOING
- WAITLISTED
- CANCELLED

“Not Going” is a UI condition/no-active-RSVP state.

---

## GR-018 — Restricted Screen

Restricted/suspended account routing uses P20.

P18 remains Delete Account.

---

## GR-019 — Generic Analytics

Generic `screen_viewed` / `cta_tapped` events must not replace the approved semantic event catalog.

---

## GR-020 — Neighborhood

Current/live neighborhood is not exposed by default in V1.

Consumer location projection remains city/metro plus approved rounded distance.

---

## GR-021 — Profile Visitor Insights

Profile visitor insights are not approved for V1 and must not be implemented until separate product/privacy approval.

---

## GR-022 — Marketing Consent

Marketing communication requires affirmative user consent and remains fully revocable/opt-out.

---

## GR-023 — Design Tokens

Canonical:
- `packages/design-tokens`
- `packages/ui` consumes design tokens

Do not create a second token implementation under `packages/ui`.

---

## GR-024 — Architecture Approval Status

The accepted ADR Pack represents the approved V1 architecture baseline.

The earlier “candidate for freeze” wording in the System Architecture is superseded by ADR acceptance.

---

## GR-025 — Bootstrap Skill Count

The current Claude control package contains eight skills, including `production-incident`.

Any README claiming seven is stale.
