---
paths:
  - "packages/analytics/**"
  - "apps/**/analytics/**"
---

# Analytics Rules

The Analytics Specification is canonical for event names and KPI formulas.

Do not emit legacy aliases in parallel.

Never send PII, DOB, exact location, OTP/token data, private message content, report free text, moderator notes or verification artifacts.

Critical product outcome events should originate from backend truth where practical.

Analytics failure never blocks product operations.
