# Project Connect Governance Baseline V1.1

This package contains the corrective governance baseline produced after the read-only Claude audit.

## Replace / add

Copy into the repository root:

- `CLAUDE.md` — replacement concise root contract
- `.claude/settings.json` — hardened permission/hook configuration
- `.claude/rules/*` — corrected scoped rules
- `.claude/hooks/guard-bash.mjs` — cross-platform command guard
- `.claude/hooks/post-edit-format.mjs` — targeted cross-platform formatter
- `docs/architecture/GOVERNANCE-RESOLUTIONS-V1.1.md`

## Preserve

Do **not** delete your historical approved artifacts.

Keep the long Engineering Constitution under:
`docs/architecture/CLAUDE-ENGINEERING-CONSTITUTION.md`

Keep `ADR-PACK.md` as the approved historical ADR source.

## Git

Before feature development, use `main` as the default branch.

If still on `master`:

```bash
git branch -m master main
```

## Runtime validation

After copying, restart Claude Code from the repository root and run interactive:

- `/permissions`
- `/agents`
- `/skills`
- `/hooks`

Then run a read-only audit again.

### Important permission note

Repo-level configuration cannot safely compensate for intentionally launching Claude in a dangerous permission-bypass mode. Do not use bypass mode for Project Connect. Organization/managed policy should be used later if you need centrally enforced launch-mode restrictions.

### Secret deny validation

Claude Code permission syntax evolves. On installed Claude Code 2.1.220, verify the `Read(...)` deny patterns in `/permissions`. If the installed runtime does not recognize a pattern, do not weaken the rule—adjust the pattern to the syntax shown by that runtime before proceeding.
