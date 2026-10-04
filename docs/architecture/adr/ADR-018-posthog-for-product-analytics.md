# ADR-018 — POSTHOG FOR PRODUCT ANALYTICS

## Status
ACCEPTED

## Decision

Use PostHog for V1 product analytics and experimentation.

---

## Privacy Position

Do not send:

- names;
- phone;
- email;
- DOB;
- exact location;
- message content;
- report text;
- dating-preference detail beyond approved aggregate codes.

Session replay:

**disabled by default.**

---

## Alternatives

### Amplitude

Strong option.

Rejected only to avoid multiple overlapping analytics platforms.

### Mixpanel

Also viable.

---

## Reversal Conditions

Change if:

- privacy model becomes incompatible;
- scale/cost becomes material;
- advanced warehouse-first analytics strategy emerges.
