import { sql } from 'drizzle-orm';
import { check, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * DATA-MODEL §audit_events. Append-only: the application only inserts. Must
 * never hold secrets, tokens, OTPs, raw phone numbers or dates of birth.
 */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorType: text('actor_type').notNull(),
    actorId: uuid('actor_id'),
    actionCode: text('action_code').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),
    reasonCode: text('reason_code'),
    correlationId: text('correlation_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    check('audit_events_actor_type_ck', sql`${t.actorType} IN ('USER','ADMIN','SYSTEM','SERVICE')`),
  ],
);
