import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

import { users } from './identity.js';

// Owned by the profile module (DATA-MODEL §69: Intent → Profile domain).
// The DATING row of user_intents is written only through the dating module,
// in the same transaction as its consent record (B4.2A).

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * DATA-MODEL §17. Reference data: top-level intents (parent_code NULL) and
 * dating sub-intents (parent_code = 'DATING'). Deactivated, never deleted.
 */
export const intentOptions = pgTable(
  'intent_options',
  {
    code: text('code').primaryKey(),
    parentCode: text('parent_code').references((): AnyPgColumn => intentOptions.code),
    label: varchar('label', { length: 60 }).notNull(),
    description: varchar('description', { length: 160 }),
    active: boolean('active').notNull().default(true),
    displayOrder: integer('display_order').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    check('intent_options_code_format_ck', sql`${t.code} ~ '^[A-Z][A-Z_]{1,39}$'`),
    check(
      'intent_options_not_own_parent_ck',
      sql`${t.parentCode} IS NULL OR ${t.parentCode} <> ${t.code}`,
    ),
    check('intent_options_label_not_blank_ck', sql`length(btrim(${t.label})) > 0`),
  ],
);

/**
 * DATA-MODEL §16. One row per (user, intent) ever selected; deselection keeps
 * the row inactive rather than deleting it. Re-selection reactivates it.
 */
export const userIntents = pgTable(
  'user_intents',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    intentCode: text('intent_code')
      .notNull()
      .references(() => intentOptions.code),
    active: boolean('active').notNull(),
    selectedAt: timestamptz('selected_at').notNull(),
    deselectedAt: timestamptz('deselected_at'),
  },
  (t) => [
    primaryKey({ name: 'user_intents_pk', columns: [t.userId, t.intentCode] }),
    // Active ⇔ not deselected.
    check('user_intents_active_consistency_ck', sql`${t.active} = (${t.deselectedAt} IS NULL)`),
    check(
      'user_intents_deselected_after_selected_ck',
      sql`${t.deselectedAt} IS NULL OR ${t.deselectedAt} >= ${t.selectedAt}`,
    ),
  ],
);
