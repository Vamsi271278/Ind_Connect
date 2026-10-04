# ADR-100 — CLAUDE CODE IS CONSTRAINED ENGINEERING AGENT

## Status
ACCEPTED

Claude Code is authorized to implement within the approved architecture.

It is not authorized to redefine architecture silently.

---

## Claude Must

- follow ADRs;
- follow business rules;
- use approved libraries;
- write tests;
- explain architectural deviations.

---

## Claude Must Not

- introduce new cloud platforms;
- add microservices;
- change database;
- change API style;
- weaken security;
- bypass authorization;
- replace vendor abstractions;
- add packages casually;
- alter safety policies;
- invent product scope.
