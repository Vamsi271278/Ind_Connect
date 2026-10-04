---
name: fix-bug
description: Diagnose and fix an existing Project Connect defect using reproduction, root-cause analysis, minimal correction, regression tests, and adjacent-risk review.
---

# Fix Bug

1. Reproduce or establish the failure from credible evidence.
2. Identify the actual root cause before broad edits.
3. Classify impact:
   - safety
   - security
   - privacy
   - data integrity
   - money
   - availability
   - ordinary UX
4. Add or identify a failing regression test when practical.
5. Make the smallest correct change.
6. Avoid unrelated refactoring.
7. Run the regression test and adjacent tests.
8. Review stale-state/concurrency implications.
9. Inspect the diff.
10. Report root cause, fix, commands actually run, and anything not verified.

Never weaken validation, authorization, safety policy, or constraints merely to make a test pass.
