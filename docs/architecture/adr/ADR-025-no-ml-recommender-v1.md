# ADR-025 — NO ML RECOMMENDER V1

## Status
ACCEPTED

## Decision

Use deterministic/configurable scoring.

---

## Why

At launch we lack sufficient trustworthy behavioral data.

A machine-learning model before real user data would mostly encode assumptions.

---

## Reversal Conditions

Reconsider after:

- sufficient interactions;
- stable north-star measurement;
- baseline recommendation performance;
- clear evaluation dataset.
