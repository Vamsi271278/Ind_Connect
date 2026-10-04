# ADR-017 — GITHUB ACTIONS CI/CD

## Status
ACCEPTED

## Decision

Use GitHub Actions for:

- validation;
- testing;
- image builds;
- infrastructure plans;
- deployment orchestration.

EAS handles mobile build/release execution.

---

## Mandatory PR Pipeline

```text
format
lint
typecheck
unit
integration
contract
security
migration validation
```

---

## Production Rules

Production deployment must originate from CI.

Not developer laptop.
