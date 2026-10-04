---
paths:
  - "infrastructure/**"
  - ".github/workflows/**"
---

# Infrastructure Rules

- AWS + ECS Fargate + Terraform are approved.
- RDS/Redis remain private.
- Use least privilege.
- Secrets belong in Secrets Manager/KMS-backed configuration.
- No Kubernetes.
- Cloud mutation/deployment/Terraform apply-destroy require human approval.
- No production secret or PII access by default.
