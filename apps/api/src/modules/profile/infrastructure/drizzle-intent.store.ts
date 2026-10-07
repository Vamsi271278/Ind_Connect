import { and, asc, eq, isNull, sql } from 'drizzle-orm';

import type { Database, DbExecutor } from '../../../shared/database/database.module.js';
import { executorOf } from '../../../shared/database/drizzle-unit-of-work.js';
import { intentOptions, userIntents } from '../../../shared/database/schema/index.js';
import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import {
  type IntentOption,
  isTopLevelIntentCode,
  type TopLevelIntentCode,
} from '../domain/intents.js';
import type { IntentRepository, IntentStore } from '../application/intent-ports.js';

const toCode = (value: string): TopLevelIntentCode => {
  if (!isTopLevelIntentCode(value)) throw new Error('intent code outside known top-level codes');
  return value;
};

class DrizzleIntentRepository implements IntentRepository {
  constructor(private readonly db: DbExecutor) {}

  async listTopLevelOptions(): Promise<readonly IntentOption[]> {
    const rows = await this.db
      .select({
        code: intentOptions.code,
        label: intentOptions.label,
        description: intentOptions.description,
      })
      .from(intentOptions)
      .where(and(isNull(intentOptions.parentCode), eq(intentOptions.active, true)))
      .orderBy(asc(intentOptions.displayOrder));
    return rows.map((row) => ({ ...row, code: toCode(row.code) }));
  }

  async listActiveIntents(userId: string): Promise<readonly TopLevelIntentCode[]> {
    const rows = await this.db
      .select({ code: userIntents.intentCode })
      .from(userIntents)
      .innerJoin(intentOptions, eq(intentOptions.code, userIntents.intentCode))
      .where(
        and(
          eq(userIntents.userId, userId),
          eq(userIntents.active, true),
          isNull(intentOptions.parentCode),
        ),
      )
      .orderBy(asc(intentOptions.displayOrder));
    return rows.map((row) => toCode(row.code));
  }

  async activateIntent(userId: string, code: TopLevelIntentCode, at: Date): Promise<void> {
    await this.db
      .insert(userIntents)
      .values({ userId, intentCode: code, active: true, selectedAt: at, deselectedAt: null })
      .onConflictDoUpdate({
        target: [userIntents.userId, userIntents.intentCode],
        set: {
          active: true,
          // Keep the original selection time if it was already active.
          selectedAt: sql`CASE WHEN ${userIntents.active} THEN ${userIntents.selectedAt} ELSE ${at} END`,
          deselectedAt: null,
        },
      });
  }

  async deactivateIntent(userId: string, code: TopLevelIntentCode, at: Date): Promise<boolean> {
    const changed = await this.db
      .update(userIntents)
      // Never earlier than selected_at (clock skew must not fail a withdrawal).
      .set({
        active: false,
        deselectedAt: sql`GREATEST(${at}::timestamptz, ${userIntents.selectedAt})`,
      })
      .where(
        and(
          eq(userIntents.userId, userId),
          eq(userIntents.intentCode, code),
          eq(userIntents.active, true),
        ),
      )
      .returning({ code: userIntents.intentCode });
    return changed.length > 0;
  }
}

export class DrizzleIntentStore implements IntentStore {
  readonly repository: IntentRepository;

  constructor(db: Database) {
    this.repository = new DrizzleIntentRepository(db);
  }

  forTransaction(tx: TransactionContext): IntentRepository {
    return new DrizzleIntentRepository(executorOf(tx));
  }
}
