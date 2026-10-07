import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './identity.js';

// Owned by the profile module (DATA-MODEL §11–15). Languages, interest
// categories and interests are configurable reference data (PRD §17–18):
// deactivated via `active`, never deleted. User selections are plain N:M rows
// replaced in place — they are not consent evidence, so no history is kept.

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/** DATA-MODEL §12. Initial set from PRD §17 / SFS O06. `code` is ISO 639 (lowercase). */
export const languages = pgTable(
  'languages',
  {
    code: text('code').primaryKey(),
    displayName: varchar('display_name', { length: 60 }).notNull(),
    active: boolean('active').notNull().default(true),
    displayOrder: integer('display_order').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    check('languages_code_format_ck', sql`${t.code} ~ '^[a-z]{2,3}$'`),
    check('languages_display_name_not_blank_ck', sql`length(btrim(${t.displayName})) > 0`),
  ],
);

/** DATA-MODEL §11. Proficiency is deferred (PRD §17: not necessary for V1). */
export const userLanguages = pgTable(
  'user_languages',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    languageCode: text('language_code')
      .notNull()
      .references(() => languages.code),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ name: 'user_languages_pk', columns: [t.userId, t.languageCode] })],
);

/** DATA-MODEL §15. The six PRD §18 categories. */
export const interestCategories = pgTable(
  'interest_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    label: varchar('label', { length: 60 }).notNull(),
    active: boolean('active').notNull().default(true),
    displayOrder: integer('display_order').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('interest_categories_code_uq').on(t.code),
    check('interest_categories_code_format_ck', sql`${t.code} ~ '^[A-Z][A-Z0-9_]{1,39}$'`),
    check('interest_categories_label_not_blank_ck', sql`length(btrim(${t.label})) > 0`),
  ],
);

/** DATA-MODEL §14. Controlled taxonomy (BR-PROF-010); `icon_key` deferred (no icons yet). */
export const interests = pgTable(
  'interests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull(),
    label: varchar('label', { length: 60 }).notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => interestCategories.id),
    active: boolean('active').notNull().default(true),
    displayOrder: integer('display_order').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('interests_code_uq').on(t.code),
    check('interests_code_format_ck', sql`${t.code} ~ '^[A-Z][A-Z0-9_]{1,39}$'`),
    check('interests_label_not_blank_ck', sql`length(btrim(${t.label})) > 0`),
  ],
);

/** DATA-MODEL §13. */
export const userInterests = pgTable(
  'user_interests',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    interestId: uuid('interest_id')
      .notNull()
      .references(() => interests.id),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ name: 'user_interests_pk', columns: [t.userId, t.interestId] })],
);
