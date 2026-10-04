# ADR-010 — REVENUECAT FOR MOBILE SUBSCRIPTIONS

## Status
ACCEPTED

## Decision

Use RevenueCat to abstract Apple and Google subscriptions.

Backend mirrors authoritative product entitlements.

---

## Rationale

Reduces complexity around:

- receipts;
- renewals;
- grace periods;
- platform differences.

---

## Alternatives

### Direct Apple + Google Integration

Technically possible but increases billing engineering and reconciliation complexity.

Rejected for V1.

---

## Critical Rule

RevenueCat client state does not authorize premium APIs.

Backend entitlement does.

---

## Reversal Conditions

Consider direct store integration only if:

- vendor cost becomes material;
- custom billing workflows demand it;
- scale justifies ownership.
