import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './identity.js';

// Owned by the location module. metros/cities are reference data (deactivated
// via launch_status, never deleted). user_locations holds only the CURRENT
// discovery geography: one row per user, overwritten in place — never a
// history (ADR-057, DATA-MODEL §87).

const LAUNCH_STATUS_VALUES = sql.raw(`'ACTIVE','WAITLIST','FUTURE','DISABLED'`);

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/** DATA-MODEL §23. Market unit (e.g. DFW). Expansion is data, not schema (§126). */
export const metros = pgTable(
  'metros',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 16 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    // IANA zone, e.g. America/Chicago.
    timezone: varchar('timezone', { length: 64 }).notNull(),
    launchStatus: text('launch_status').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique('metros_code_uq').on(t.code),
    // Target of the cities (metro_id, country_code) composite FK.
    unique('metros_id_country_uq').on(t.id, t.countryCode),
    check('metros_code_format_ck', sql`${t.code} ~ '^[A-Z][A-Z0-9_]{1,15}$'`),
    check('metros_name_not_blank_ck', sql`length(btrim(${t.name})) > 0`),
    check('metros_country_code_format_ck', sql`${t.countryCode} ~ '^[A-Z]{2}$'`),
    check('metros_timezone_not_blank_ck', sql`length(btrim(${t.timezone})) > 0`),
    check('metros_launch_status_ck', sql`${t.launchStatus} IN (${LAUNCH_STATUS_VALUES})`),
  ],
);

/**
 * DATA-MODEL §22. Selectable cities. Centroid coordinates are deferred until
 * distance needs them (additive nullable columns); none are seeded now.
 */
export const cities = pgTable(
  'cities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    metroId: uuid('metro_id').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    // Display abbreviation, e.g. TX.
    stateRegion: varchar('state_region', { length: 64 }).notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    launchStatus: text('launch_status').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    // A city's country is its metro's country.
    foreignKey({
      name: 'cities_metro_country_fk',
      columns: [t.metroId, t.countryCode],
      foreignColumns: [metros.id, metros.countryCode],
    }),
    unique('cities_country_region_name_uq').on(t.countryCode, t.stateRegion, t.name),
    // Target of the user_locations (city_id, metro_id, country_code) composite FK.
    unique('cities_id_metro_country_uq').on(t.id, t.metroId, t.countryCode),
    check('cities_name_not_blank_ck', sql`length(btrim(${t.name})) > 0`),
    check('cities_state_region_not_blank_ck', sql`length(btrim(${t.stateRegion})) > 0`),
    check('cities_country_code_format_ck', sql`${t.countryCode} ~ '^[A-Z]{2}$'`),
    check('cities_launch_status_ck', sql`${t.launchStatus} IN (${LAUNCH_STATUS_VALUES})`),
  ],
);

/**
 * DATA-MODEL §21 (B4.1 subset). Current discovery geography, 1:1 with users.
 * B4.1 collects a manually chosen city only: no coordinates are stored, so
 * precision/source are constrained to MANUAL_CITY / MANUAL. DEVICE/GPS (and the
 * latitude/longitude columns) arrive with a reviewed additive migration when
 * device location is formally introduced.
 */
export const userLocations = pgTable(
  'user_locations',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id),
    cityId: uuid('city_id').notNull(),
    // Derived from the city by the server; the composite FK below makes a
    // mismatched metro or country unrepresentable.
    metroId: uuid('metro_id').notNull(),
    countryCode: varchar('country_code', { length: 2 }).notNull(),
    precisionType: text('precision_type').notNull(),
    source: text('source').notNull(),
    capturedAt: timestamptz('captured_at').notNull(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: 'user_locations_city_metro_country_fk',
      columns: [t.cityId, t.metroId, t.countryCode],
      foreignColumns: [cities.id, cities.metroId, cities.countryCode],
    }),
    check('user_locations_precision_type_ck', sql`${t.precisionType} IN ('MANUAL_CITY')`),
    check('user_locations_source_ck', sql`${t.source} IN ('MANUAL')`),
  ],
);
