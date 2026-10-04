---
name: production-incident
description: Guide Project Connect production incident analysis with containment-first, reversible, evidence-preserving engineering behavior.
---

# Production Incident

Prioritize:
1. user safety
2. data integrity
3. containment
4. reversibility
5. evidence preservation
6. restoration
7. root cause
8. long-term prevention

Do not opportunistically refactor during containment.

Establish:
- incident start/time window
- affected users/systems
- severity
- known facts vs hypotheses
- current safety/data risk
- containment options
- reversible mitigation
- observability evidence
- rollback path

Claude may analyze and propose changes.
Claude must not autonomously access production PII/secrets, deploy production, delete production data, or run destructive infrastructure/database commands.

After stabilization, prepare a postmortem outline:
- impact
- timeline
- detection
- root cause
- contributing factors
- containment
- recovery
- corrective actions
- owners/tests/monitoring
