# ADR-037 — SECRETS MANAGER + KMS

## Status
ACCEPTED

Secrets live in AWS Secrets Manager.

Encryption keys managed through KMS.

---

## Prohibited

- committing `.env.production`;
- placing secrets in CLAUDE.md;
- embedding API secrets in mobile.
