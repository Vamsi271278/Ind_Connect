# ADR-006 — ECS FARGATE COMPUTE

## Status
ACCEPTED

## Decision

Run backend containers on:

**Amazon ECS Fargate**

---

## Rationale

Provides:

- managed container execution;
- autoscaling;
- no server management;
- no Kubernetes cluster management.

---

## Alternatives

### Kubernetes / EKS

Rejected due operational complexity.

### Lambda

Rejected as primary backend because of:

- WebSocket/realtime considerations;
- persistent service structure;
- simpler monolithic container deployment.

---

## Risks

Higher unit compute cost than aggressively optimized EC2.

---

## Mitigation

Accept higher early-stage unit cost in exchange for operational simplicity.

---

## Reversal Conditions

Reassess if:

- sustained high compute cost;
- container scheduling needs become complex;
- platform team becomes large enough to justify Kubernetes.
