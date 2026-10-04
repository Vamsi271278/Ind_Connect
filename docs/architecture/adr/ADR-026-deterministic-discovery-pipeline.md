# ADR-026 — DETERMINISTIC DISCOVERY PIPELINE

## Status
ACCEPTED

## Decision

Discovery architecture:

```text
Candidate Generation
→ Eligibility
→ Scoring
→ Diversification
→ Pagination
```

---

## Hard Rule

Eligibility occurs before ranking.

Ranking can never resurrect an ineligible profile.

---

## Ranking Inputs

Approved V1:

- intent compatibility;
- shared interests;
- distance;
- language;
- verification;
- profile completeness;
- recent activity.
