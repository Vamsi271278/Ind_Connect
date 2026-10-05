import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

// Owned by the identity module. Other modules must not write these tables.

const ACCOUNT_STATUS_VALUES = sql.raw(
  `'ACTIVE','PENDING_VERIFICATION','LIMITED','UNDER_REVIEW','SUSPENDED','BANNED','DEACTIVATED','DELETION_PENDING','DELETED'`,
);
const ONBOARDING_STATUS_VALUES = sql.raw(`'NOT_STARTED','IN_PROGRESS','COMPLETE'`);
const ONBOARDING_STEP_VALUES = sql.raw(
  `'AGE','PHONE','NAME','GENDER','LOCATION','INTENT','LANGUAGE','INTERESTS','PHOTO','ABOUT','VERIFICATION','NOTIFICATIONS','COMPLETE'`,
);
const REVOCATION_REASON_VALUES = sql.raw(
  `'ROTATED','SUPERSEDED','REPLAY_REPLACED','LOGOUT','LOGOUT_ALL','REUSE_DETECTED','ACCOUNT_ACTION'`,
);

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/** DATA-MODEL §users. One row per consumer account. */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phoneE164: varchar('phone_e164', { length: 20 }).notNull(),
    phoneVerifiedAt: timestamptz('phone_verified_at').notNull(),
    dateOfBirth: date('date_of_birth', { mode: 'string' }).notNull(),
    accountStatus: text('account_status').notNull().default('PENDING_VERIFICATION'),
    onboardingStatus: text('onboarding_status').notNull(),
    onboardingStep: text('onboarding_step').notNull(),
    discoverable: boolean('discoverable').notNull().default(false),
    lastActiveAt: timestamptz('last_active_at'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    // One account per phone number, except DELETED accounts (whose phone is
    // anonymized by the deletion workflow). BANNED/SUSPENDED accounts keep the
    // number, so it cannot be re-registered.
    uniqueIndex('users_phone_e164_not_deleted_uq')
      .on(t.phoneE164)
      .where(sql`${t.accountStatus} <> 'DELETED'`),
    check('users_phone_e164_format_ck', sql`${t.phoneE164} ~ '^\\+[1-9][0-9]{6,14}$'`),
    check('users_account_status_ck', sql`${t.accountStatus} IN (${ACCOUNT_STATUS_VALUES})`),
    check(
      'users_onboarding_status_ck',
      sql`${t.onboardingStatus} IN (${ONBOARDING_STATUS_VALUES})`,
    ),
    check('users_onboarding_step_ck', sql`${t.onboardingStep} IN (${ONBOARDING_STEP_VALUES})`),
    check('users_date_of_birth_floor_ck', sql`${t.dateOfBirth} >= DATE '1900-01-01'`),
    // Age >= 18 at account creation (BR-AUTH-001). Deterministic: evaluated
    // against the row's own created_at, not the current clock. Uses the same
    // conservative boundary as the server: the calendar date at UTC-12, so no
    // one qualifies before their 18th birthday anywhere. 'Etc/GMT+12' is UTC-12
    // (POSIX sign convention). Feb 29 births qualify on Mar 1 in common years.
    check(
      'users_minimum_age_at_creation_ck',
      sql`${t.dateOfBirth} <= ((${t.createdAt} AT TIME ZONE 'Etc/GMT+12')::date - INTERVAL '18 years')::date`,
    ),
  ],
);

/**
 * GR-011 / DATA-MODEL §161.1. One row per issued refresh token; a token family
 * is one sign-in. Rotation inserts a new row and links the old one forward.
 */
export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    tokenFamilyId: uuid('token_family_id').notNull(),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    deviceContext: jsonb('device_context').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    lastUsedAt: timestamptz('last_used_at'),
    expiresAt: timestamptz('expires_at').notNull(),
    revokedAt: timestamptz('revoked_at'),
    revocationReason: text('revocation_reason'),
    replacedBySessionId: uuid('replaced_by_session_id').references(
      (): AnyPgColumn => userSessions.id,
    ),
    rotatedAt: timestamptz('rotated_at'),
  },
  (t) => [
    uniqueIndex('user_sessions_refresh_token_hash_uq').on(t.refreshTokenHash),
    index('user_sessions_user_id_idx').on(t.userId),
    index('user_sessions_token_family_id_idx').on(t.tokenFamilyId),
    check('user_sessions_refresh_token_hash_ck', sql`${t.refreshTokenHash} ~ '^[0-9a-f]{64}$'`),
    check(
      'user_sessions_revocation_reason_ck',
      sql`${t.revocationReason} IS NULL OR ${t.revocationReason} IN (${REVOCATION_REASON_VALUES})`,
    ),
    check(
      'user_sessions_revocation_consistency_ck',
      sql`(${t.revokedAt} IS NULL) = (${t.revocationReason} IS NULL)`,
    ),
    check(
      'user_sessions_rotation_consistency_ck',
      sql`(${t.revocationReason} IS NOT DISTINCT FROM 'ROTATED') = (${t.rotatedAt} IS NOT NULL)`,
    ),
    check(
      'user_sessions_rotation_link_ck',
      sql`${t.rotatedAt} IS NULL OR ${t.replacedBySessionId} IS NOT NULL`,
    ),
    check('user_sessions_not_self_replaced_ck', sql`${t.replacedBySessionId} <> ${t.id}`),
    check('user_sessions_expiry_ck', sql`${t.expiresAt} > ${t.createdAt}`),
  ],
);
