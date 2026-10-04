---
name: prepare-pr
description: Perform final Project Connect change validation and prepare a truthful, implementation-grade pull request summary.
---

# Prepare PR

## Inspect
- `git status`
- complete diff
- unexpected files
- generated files
- migration changes
- dependency/lockfile changes

## Validate
Run only commands that actually exist in this repository. Prefer:
- format/check
- lint
- typecheck
- targeted tests
- integration tests where relevant
- architecture check
- secret/security checks where configured

Never claim a command passed unless it was executed successfully.

## Review
Confirm:
- requirement traceability
- authorization
- privacy
- safety
- API/OpenAPI
- analytics
- notifications
- accessibility
- migration/deployment notes
- feature flags/config

## PR Summary
Produce:
- Summary
- Requirement / docs / ADRs
- Affected domains
- Security & privacy impact
- Safety impact
- Database/migrations
- Analytics/notifications
- Tests actually run
- Deployment notes
- Known limitations/unverified items
