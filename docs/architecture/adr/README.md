# Architecture Decision Records

`ADR-PACK.md` is the preserved, authoritative approved source. The files below are exact extracts for usability (see [SPEC-RECONCILIATION R-13](../SPEC-RECONCILIATION.md)). If an extract ever differs from the pack, **the pack wins**. Where [SYSTEM-ARCHITECTURE.md](../SYSTEM-ARCHITECTURE.md) lists different ADR numbers or titles, the pack wins (R-14).

The pack also contains the ADR operating procedure (sections 101–112: referencing ADRs in PRs, CI enforcement, review cadence, reversal standard, risk register, architecture freeze statement). Those sections remain in the pack only.

Supporting technologies ratified by [R-05](../SPEC-RECONCILIATION.md) (Drizzle ORM, FCM, EventBridge Scheduler, Vitest, Maestro, OpenTelemetry, CloudWatch, Sentry) and the API namespaces in R-06 are approved and awaiting formal ADR write-ups.

| ADR | Title |
|---|---|
| [ADR-001](ADR-001-react-native-expo.md) | REACT NATIVE + EXPO |
| [ADR-002](ADR-002-modular-monolith-backend.md) | MODULAR MONOLITH BACKEND |
| [ADR-003](ADR-003-rest-openapi.md) | REST + OPENAPI |
| [ADR-004](ADR-004-postgresql-postgis.md) | POSTGRESQL + POSTGIS |
| [ADR-005](ADR-005-aws-as-primary-cloud.md) | AWS AS PRIMARY CLOUD |
| [ADR-006](ADR-006-ecs-fargate-compute.md) | ECS FARGATE COMPUTE |
| [ADR-007](ADR-007-redis-for-ephemeral-state.md) | REDIS FOR EPHEMERAL STATE |
| [ADR-008](ADR-008-rest-write-websocket-delivery-for-messaging.md) | REST WRITE + WEBSOCKET DELIVERY FOR MESSAGING |
| [ADR-009](ADR-009-phone-auth-twilio-verify.md) | PHONE AUTH + TWILIO VERIFY |
| [ADR-010](ADR-010-revenuecat-for-mobile-subscriptions.md) | REVENUECAT FOR MOBILE SUBSCRIPTIONS |
| [ADR-011](ADR-011-s3-cloudfront-for-media.md) | S3 + CLOUDFRONT FOR MEDIA |
| [ADR-012](ADR-012-sqs-transactional-outbox.md) | SQS + TRANSACTIONAL OUTBOX |
| [ADR-013](ADR-013-tanstack-query-for-server-state.md) | TANSTACK QUERY FOR SERVER STATE |
| [ADR-014](ADR-014-zustand-only-for-local-ui-state.md) | ZUSTAND ONLY FOR LOCAL UI STATE |
| [ADR-015](ADR-015-monorepo-with-pnpm-turborepo.md) | MONOREPO WITH PNPM + TURBOREPO |
| [ADR-016](ADR-016-terraform-for-infrastructure.md) | TERRAFORM FOR INFRASTRUCTURE |
| [ADR-017](ADR-017-github-actions-ci-cd.md) | GITHUB ACTIONS CI/CD |
| [ADR-018](ADR-018-posthog-for-product-analytics.md) | POSTHOG FOR PRODUCT ANALYTICS |
| [ADR-019](ADR-019-sentry-cloudwatch-opentelemetry.md) | SENTRY + CLOUDWATCH + OPENTELEMETRY |
| [ADR-020](ADR-020-security-architecture.md) | SECURITY ARCHITECTURE |
| [ADR-021](ADR-021-data-privacy-architecture.md) | DATA PRIVACY ARCHITECTURE |
| [ADR-022](ADR-022-no-microservices-v1.md) | NO MICROservices V1 |
| [ADR-023](ADR-023-no-kubernetes-v1.md) | NO KUBERNETES V1 |
| [ADR-024](ADR-024-no-graphql-v1.md) | NO GRAPHQL V1 |
| [ADR-025](ADR-025-no-ml-recommender-v1.md) | NO ML RECOMMENDER V1 |
| [ADR-026](ADR-026-deterministic-discovery-pipeline.md) | DETERMINISTIC DISCOVERY PIPELINE |
| [ADR-027](ADR-027-centralized-authorization-policies.md) | CENTRALIZED AUTHORIZATION POLICIES |
| [ADR-028](ADR-028-dto-projection-boundaries.md) | DTO PROJECTION BOUNDARIES |
| [ADR-029](ADR-029-database-transactions-for-relationship-state.md) | DATABASE TRANSACTIONS FOR RELATIONSHIP STATE |
| [ADR-030](ADR-030-external-provider-abstractions.md) | EXTERNAL PROVIDER ABSTRACTIONS |
| [ADR-031](ADR-031-identity-verification-provider-not-yet-frozen.md) | IDENTITY VERIFICATION PROVIDER NOT YET FROZEN |
| [ADR-032](ADR-032-feature-flags-remote-configuration.md) | FEATURE FLAGS + REMOTE CONFIGURATION |
| [ADR-033](ADR-033-admin-app-as-separate-security-boundary.md) | ADMIN APP AS SEPARATE SECURITY BOUNDARY |
| [ADR-034](ADR-034-next-js-admin-web-application.md) | NEXT.JS ADMIN WEB APPLICATION |
| [ADR-035](ADR-035-staff-mfa-mandatory.md) | STAFF MFA MANDATORY |
| [ADR-036](ADR-036-transactional-logging-correlation-ids.md) | TRANSACTIONAL LOGGING + CORRELATION IDS |
| [ADR-037](ADR-037-secrets-manager-kms.md) | SECRETS MANAGER + KMS |
| [ADR-038](ADR-038-presigned-direct-media-uploads.md) | PRESIGNED DIRECT MEDIA UPLOADS |
| [ADR-039](ADR-039-exif-stripping.md) | EXIF STRIPPING |
| [ADR-040](ADR-040-private-safety-verification-storage.md) | PRIVATE SAFETY/VERIFICATION STORAGE |
| [ADR-041](ADR-041-app-store-subscriptions-only-for-mobile-digital-entitlements.md) | APP STORE SUBSCRIPTIONS ONLY FOR MOBILE DIGITAL ENTITLEMENTS |
| [ADR-042](ADR-042-analytics-failure-must-not-block-user-action.md) | ANALYTICS FAILURE MUST NOT BLOCK USER ACTION |
| [ADR-043](ADR-043-push-failure-must-not-block-domain-transaction.md) | PUSH FAILURE MUST NOT BLOCK DOMAIN TRANSACTION |
| [ADR-044](ADR-044-security-invalidation-overrides-cache.md) | SECURITY INVALIDATION OVERRIDES CACHE |
| [ADR-045](ADR-045-no-global-user-search-v1.md) | NO GLOBAL USER SEARCH V1 |
| [ADR-046](ADR-046-cursor-pagination.md) | CURSOR PAGINATION |
| [ADR-047](ADR-047-versioned-database-migrations.md) | VERSIONED DATABASE MIGRATIONS |
| [ADR-048](ADR-048-expand-contract-schema-changes.md) | EXPAND-CONTRACT SCHEMA CHANGES |
| [ADR-049](ADR-049-no-production-data-in-nonproduction.md) | NO PRODUCTION DATA IN NONPRODUCTION |
| [ADR-050](ADR-050-trunk-based-development.md) | TRUNK-BASED DEVELOPMENT |
| [ADR-051](ADR-051-codeowners-for-high-risk-domains.md) | CODEOWNERS FOR HIGH-RISK DOMAINS |
| [ADR-052](ADR-052-automated-security-scanning.md) | AUTOMATED SECURITY SCANNING |
| [ADR-053](ADR-053-real-postgresql-in-integration-tests.md) | REAL POSTGRESQL IN INTEGRATION TESTS |
| [ADR-054](ADR-054-maestro-mobile-e2e.md) | MAESTRO MOBILE E2E |
| [ADR-055](ADR-055-synthetic-seed-personas.md) | SYNTHETIC SEED PERSONAS |
| [ADR-056](ADR-056-data-deletion-orchestrator.md) | DATA-DELETION ORCHESTRATOR |
| [ADR-057](ADR-057-no-continuous-location-history.md) | NO CONTINUOUS LOCATION HISTORY |
| [ADR-058](ADR-058-approximate-distance-only-to-client.md) | APPROXIMATE DISTANCE ONLY TO CLIENT |
| [ADR-059](ADR-059-safety-features-are-non-commercial.md) | SAFETY FEATURES ARE NON-COMMERCIAL |
| [ADR-060](ADR-060-block-has-system-wide-precedence.md) | BLOCK HAS SYSTEM-WIDE PRECEDENCE |
| [ADR-061](ADR-061-dating-consent-as-versioned-record.md) | DATING CONSENT AS VERSIONED RECORD |
| [ADR-062](ADR-062-product-configuration-is-not-code-constants.md) | PRODUCT CONFIGURATION IS NOT CODE CONSTANTS |
| [ADR-063](ADR-063-no-event-sourcing-v1.md) | NO EVENT SOURCING V1 |
| [ADR-064](ADR-064-no-heavy-cqrs-framework-v1.md) | NO HEAVY CQRS FRAMEWORK V1 |
| [ADR-065](ADR-065-no-elasticsearch-v1.md) | NO ELASTICSEARCH V1 |
| [ADR-066](ADR-066-no-kafka-v1.md) | NO KAFKA V1 |
| [ADR-067](ADR-067-one-primary-programming-language-family.md) | ONE PRIMARY PROGRAMMING LANGUAGE FAMILY |
| [ADR-068](ADR-068-strict-typescript.md) | STRICT TYPESCRIPT |
| [ADR-069](ADR-069-zod-for-runtime-validation.md) | ZOD FOR RUNTIME VALIDATION |
| [ADR-070](ADR-070-no-direct-orm-access-from-controllers.md) | NO DIRECT ORM ACCESS FROM CONTROLLERS |
| [ADR-071](ADR-071-domain-layer-framework-independence.md) | DOMAIN LAYER FRAMEWORK INDEPENDENCE |
| [ADR-072](ADR-072-outbound-provider-timeouts-required.md) | OUTBOUND PROVIDER TIMEOUTS REQUIRED |
| [ADR-073](ADR-073-retries-require-classification.md) | RETRIES REQUIRE CLASSIFICATION |
| [ADR-074](ADR-074-dead-letter-queues.md) | DEAD LETTER QUEUES |
| [ADR-075](ADR-075-health-readiness-endpoints.md) | HEALTH + READINESS ENDPOINTS |
| [ADR-076](ADR-076-maintenance-minimum-version-bootstrap.md) | MAINTENANCE + MINIMUM VERSION BOOTSTRAP |
| [ADR-077](ADR-077-production-infrastructure-multi-az-not-multi-region.md) | PRODUCTION INFRASTRUCTURE MULTI-AZ, NOT MULTI-REGION |
| [ADR-078](ADR-078-initial-dr-target.md) | INITIAL DR TARGET |
| [ADR-079](ADR-079-quarterly-restore-test.md) | QUARTERLY RESTORE TEST |
| [ADR-080](ADR-080-cost-monitoring-from-day-one.md) | COST MONITORING FROM DAY ONE |
| [ADR-081](ADR-081-no-unbounded-third-party-sdk-additions.md) | NO UNBOUNDED THIRD-PARTY SDK ADDITIONS |
| [ADR-082](ADR-082-privacy-review-for-client-sdks.md) | PRIVACY REVIEW FOR CLIENT SDKs |
| [ADR-083](ADR-083-static-business-secrets-never-ship-in-mobile.md) | STATIC BUSINESS SECRETS NEVER SHIP IN MOBILE |
| [ADR-084](ADR-084-client-validation-is-ux-only.md) | CLIENT VALIDATION IS UX ONLY |
| [ADR-085](ADR-085-server-is-final-entitlement-authority.md) | SERVER IS FINAL ENTITLEMENT AUTHORITY |
| [ADR-086](ADR-086-server-is-final-dating-eligibility-authority.md) | SERVER IS FINAL DATING ELIGIBILITY AUTHORITY |
| [ADR-087](ADR-087-server-is-final-safety-authority.md) | SERVER IS FINAL SAFETY AUTHORITY |
| [ADR-088](ADR-088-in-app-notification-is-canonical.md) | IN-APP NOTIFICATION IS CANONICAL |
| [ADR-089](ADR-089-push-content-privacy-first.md) | PUSH CONTENT PRIVACY-FIRST |
| [ADR-090](ADR-090-design-tokens-as-code-contract.md) | DESIGN TOKENS AS CODE CONTRACT |
| [ADR-091](ADR-091-no-feature-specific-design-system-forks.md) | NO FEATURE-SPECIFIC DESIGN SYSTEM FORKS |
| [ADR-092](ADR-092-dark-mode-through-semantic-tokens.md) | DARK MODE THROUGH SEMANTIC TOKENS |
| [ADR-093](ADR-093-accessibility-is-release-requirement.md) | ACCESSIBILITY IS RELEASE REQUIREMENT |
| [ADR-094](ADR-094-core-feature-flags-require-kill-switch.md) | CORE FEATURE FLAGS REQUIRE KILL SWITCH |
| [ADR-095](ADR-095-safe-defaults.md) | SAFE DEFAULTS |
| [ADR-096](ADR-096-no-background-location-v1.md) | NO BACKGROUND LOCATION V1 |
| [ADR-097](ADR-097-no-address-book-ingestion-v1.md) | NO ADDRESS BOOK INGESTION V1 |
| [ADR-098](ADR-098-no-invasive-device-fingerprinting-without-review.md) | NO INVASIVE DEVICE FINGERPRINTING WITHOUT REVIEW |
| [ADR-099](ADR-099-business-rule-changes-require-product-traceability.md) | BUSINESS RULE CHANGES REQUIRE PRODUCT TRACEABILITY |
| [ADR-100](ADR-100-claude-code-is-constrained-engineering-agent.md) | CLAUDE CODE IS CONSTRAINED ENGINEERING AGENT |
