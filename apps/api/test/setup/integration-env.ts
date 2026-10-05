// Integration tests run against real PostgreSQL and Redis (ADR-053): the local
// compose stack or CI service containers. They never fall back to fakes.
const databaseUrl = process.env.TEST_DATABASE_URL;
const redisUrl = process.env.TEST_REDIS_URL;

if (databaseUrl === undefined || redisUrl === undefined) {
  throw new Error(
    'Integration tests require TEST_DATABASE_URL and TEST_REDIS_URL (local compose stack or CI services).',
  );
}

process.env.DATABASE_URL = databaseUrl;
process.env.REDIS_URL = redisUrl;
// Short grace window so reuse-after-grace is testable without long waits.
process.env.REFRESH_GRACE_SECONDS ??= '2';
