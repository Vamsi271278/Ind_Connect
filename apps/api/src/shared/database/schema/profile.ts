import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './identity.js';

// Owned by the profile module. Rows are created by the profile module on the
// first onboarding profile write (B2), never by identity.

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/** DATA-MODEL §gender_options. Reference data; deactivated, never deleted. */
export const genderOptions = pgTable('gender_options', {
  code: text('code').primaryKey(),
  label: text('label').notNull(),
  active: boolean('active').notNull().default(true),
  displayOrder: integer('display_order').notNull(),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

/** DATA-MODEL §user_profiles (first-slice subset). One-to-one with users. */
export const userProfiles = pgTable(
  'user_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id),
    firstName: varchar('first_name', { length: 50 }),
    genderCode: text('gender_code').references(() => genderOptions.code),
    genderSelfDescription: varchar('gender_self_description', { length: 80 }),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    check(
      'user_profiles_first_name_not_blank_ck',
      sql`${t.firstName} IS NULL OR length(btrim(${t.firstName})) > 0`,
    ),
    check(
      'user_profiles_gender_self_description_ck',
      // NULL-safe: a self-description requires gender_code to be definitely
      // SELF_DESCRIBE. (`FALSE OR NULL` is NULL, and a NULL CHECK passes.)
      sql`${t.genderSelfDescription} IS NULL OR (${t.genderCode} IS NOT NULL AND ${t.genderCode} = 'SELF_DESCRIBE')`,
    ),
  ],
);
