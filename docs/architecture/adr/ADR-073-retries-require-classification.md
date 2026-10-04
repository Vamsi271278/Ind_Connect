# ADR-073 — RETRIES REQUIRE CLASSIFICATION

## Status
ACCEPTED

Retry:

- transient network;
- 5xx where safe;
- throttling with backoff.

Do not retry:

- validation failures;
- invalid OTP;
- permanent provider errors.
