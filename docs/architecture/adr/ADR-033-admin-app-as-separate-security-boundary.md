# ADR-033 — ADMIN APP AS SEPARATE SECURITY BOUNDARY

## Status
ACCEPTED

## Decision

Admin UI is separate from consumer app.

Separate:

- application;
- routes;
- authentication;
- authorization;
- session handling.

---

## Why

Administrative access includes:

- moderation;
- reports;
- events;
- account actions;
- PII.

It must not be hidden functionality inside consumer app.
