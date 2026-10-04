# ADR-016 — TERRAFORM FOR INFRASTRUCTURE

## Status
ACCEPTED

## Decision

All production infrastructure managed through Terraform.

---

## Rationale

Provides:

- repeatability;
- reviewable changes;
- environment parity;
- disaster recovery support.

---

## Rejected

Manual AWS console configuration.

---

## Rule

Emergency console changes must be reconciled back to Terraform immediately.
