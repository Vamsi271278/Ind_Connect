# ADR-019 — SENTRY + CLOUDWATCH + OPENTELEMETRY

## Status
ACCEPTED

## Decision

Use:

```text
Sentry
CloudWatch
OpenTelemetry
```

for observability.

---

## Responsibility

Sentry:
- application errors;
- mobile crashes;
- release health.

CloudWatch:
- infrastructure/logs/alarms.

OpenTelemetry:
- vendor-neutral traces/metrics instrumentation.

---

## Rule

No private-message body or sensitive payload enters telemetry.
