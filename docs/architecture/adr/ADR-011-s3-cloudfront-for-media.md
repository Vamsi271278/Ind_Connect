# ADR-011 — S3 + CLOUDFRONT FOR MEDIA

## Status
ACCEPTED

## Decision

Use S3 for media objects and CloudFront for delivery.

Clients upload directly using presigned URLs.

---

## Rationale

Efficient for:

- profile images;
- event imagery;
- future message images.

---

## Security Requirements

- random keys;
- validation;
- metadata stripping;
- moderation;
- private verification bucket;
- lifecycle deletion.

---

## Alternatives

### Database Binary Storage

Rejected.

### API-Proxy Uploads

Rejected for normal image payload due unnecessary bandwidth and scaling cost.
