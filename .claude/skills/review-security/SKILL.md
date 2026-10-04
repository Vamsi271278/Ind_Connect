---
name: review-security
description: Perform an independent adversarial security review of the current Project Connect diff or specified files without changing them.
---

# Security Review

Review the current diff/scope as a hostile client.

Check:
- authentication/session correctness
- IDOR/object authorization
- RBAC/ABAC/resource relationship rules
- mass assignment
- block/restriction bypass
- entitlement spoofing
- stale authorization/cache
- input validation
- injection
- SSRF if URL fetching exists
- file upload abuse
- webhook authenticity and replay
- idempotency
- race conditions
- rate limiting
- secret exposure
- PII/location leakage
- logging/analytics leakage
- admin privilege escalation

Output findings ordered:
CRITICAL
HIGH
MEDIUM
LOW

For every finding include:
- exact location
- why it matters
- concrete failure/exploit scenario
- remediation
- regression test

Do not edit unless explicitly asked after the review.
