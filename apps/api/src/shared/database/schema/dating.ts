import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from './identity.js';

// Owned by the dating module (DATA-MODEL §69: Dating → Dating policy domain).
// SENSITIVE: self and the eligibility engine only (AUTHORIZATION §73).

const CONSENT_SOURCE_VALUES = sql.raw(`'ONBOARDING','SETTINGS','OTHER'`);

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * DATA-MODEL §18 / ADR-061. Versioned evidence of affirmative dating consent.
 * Append-only history: an opt-in inserts a row, an opt-out sets revoked_at on
 * the active row. Rows are never overwritten or deleted by the application.
 * No IP or device metadata is stored (privacy-minimal; optional per §18).
 */
export const datingConsents = pgTable(
  'dating_consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    policyVersion: varchar('policy_version', { length: 40 }).notNull(),
    source: text('source').notNull(),
    consentedAt: timestamptz('consented_at').notNull(),
    revokedAt: timestamptz('revoked_at'),
  },
  (t) => [
    // At most one active (unrevoked) consent per user.
    uniqueIndex('dating_consents_one_active_per_user_uq')
      .on(t.userId)
      .where(sql`${t.revokedAt} IS NULL`),
    check('dating_consents_source_ck', sql`${t.source} IN (${CONSENT_SOURCE_VALUES})`),
    check(
      'dating_consents_policy_version_format_ck',
      sql`${t.policyVersion} ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$'`,
    ),
    check(
      'dating_consents_revoked_after_consented_ck',
      sql`${t.revokedAt} IS NULL OR ${t.revokedAt} >= ${t.consentedAt}`,
    ),
  ],
);
