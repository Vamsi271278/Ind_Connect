# ADR-032 — FEATURE FLAGS + REMOTE CONFIGURATION

## Status
ACCEPTED

## Decision

Use server-side feature flags and configuration.

---

## Feature Flags

Examples:

```text
dating_enabled
image_messaging_enabled
premium_enabled
attendee_discovery_enabled
```

---

## Remote Configuration

Examples:

```text
connection.daily_limit
request.expiry_days
ranking.weight.intent
```

---

## Rule

Safety-sensitive features need immediate server-side kill switch.
