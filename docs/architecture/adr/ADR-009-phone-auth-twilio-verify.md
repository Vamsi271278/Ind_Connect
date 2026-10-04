# ADR-009 — PHONE AUTH + TWILIO VERIFY

## Status
ACCEPTED

## Decision

Phone verification is mandatory.

Use Twilio Verify as SMS verification provider.

Project Connect owns application sessions.

---

## Rationale

Phone identity reduces:

- fake account friction;
- account duplication;
- anonymous abuse.

Twilio reduces commodity OTP engineering.

---

## Important Boundary

Twilio confirms:

**possession of phone**

not:

**identity safety**

and not:

**account authorization.**

---

## Alternatives

### Firebase Authentication

Rejected as primary auth authority because we want Project Connect session/security control.

### Custom SMS OTP

Rejected due fraud, delivery, and operational complexity.

---

## Risks

- SMS fraud;
- SIM swap;
- provider dependency;
- OTP cost.

---

## Mitigation

- rate limits;
- device/IP signals;
- risk detection;
- short OTP lifetime;
- refresh token security.
