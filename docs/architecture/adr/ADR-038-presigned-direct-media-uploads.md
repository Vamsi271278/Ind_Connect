# ADR-038 — PRESIGNED DIRECT MEDIA UPLOADS

## Status
ACCEPTED

Mobile uploads directly to S3 using short-lived presigned authorization.

---

## Backend Responsibilities

Before signing:

- authenticate user;
- validate intended media type;
- enforce upload quota;
- generate safe object key.

After upload:

- media remains PENDING;
- moderation occurs before public use.
