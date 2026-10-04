# ADR-030 — EXTERNAL PROVIDER ABSTRACTIONS

## Status
ACCEPTED

## Decision

External vendors must sit behind interfaces.

---

## Required Interfaces

```text
PhoneVerificationProvider
PushProvider
SubscriptionProvider
IdentityVerificationProvider
AnalyticsProvider
MediaModerationProvider
```

---

## Rationale

Reduces vendor lock-in and test complexity.
