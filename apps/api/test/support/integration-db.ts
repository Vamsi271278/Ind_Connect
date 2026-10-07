import { sql } from 'drizzle-orm';
import { createClient, type RedisClientType } from 'redis';

import type { Database } from '../../src/shared/database/database.module.js';

/**
 * Clears transactional tables; reference data (gender_options, metros, cities,
 * intent_options, languages, interest_categories, interests) is kept.
 */
export async function resetDatabase(db: Database): Promise<void> {
  await db.execute(
    sql`TRUNCATE audit_events, dating_consents, user_intents, user_interests, user_languages, user_locations, user_profiles, user_sessions, users RESTART IDENTITY CASCADE`,
  );
}

/** Deletes only Project Connect keys (pc:*), never the whole Redis database. */
export async function resetRedis(url: string): Promise<void> {
  const client: RedisClientType = createClient({ url });
  await client.connect();
  try {
    for await (const keys of client.scanIterator({ MATCH: 'pc:*', COUNT: 500 })) {
      if (keys.length > 0) await client.del(keys);
    }
  } finally {
    await client.close();
  }
}
