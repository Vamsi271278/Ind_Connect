# ADR-028 — DTO PROJECTION BOUNDARIES

## Status
ACCEPTED

## Decision

Never expose ORM/database entities directly.

Layers:

```text
Database Entity
→ Domain Model
→ Application Result
→ API DTO
```

---

## Required DTO Categories

```text
SelfProfileDto
PublicProfileDto
ConnectedProfileDto
ModeratorUserDto
SupportUserDto
```
