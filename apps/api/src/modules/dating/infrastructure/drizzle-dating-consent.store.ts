import { and, eq, isNull, sql } from 'drizzle-orm';

import type { Database, DbExecutor } from '../../../shared/database/database.module.js';
import { executorOf } from '../../../shared/database/drizzle-unit-of-work.js';
import { datingConsents } from '../../../shared/database/schema/index.js';
import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import type { ActiveConsent, ConsentSource } from '../domain/consent.js';
import type { DatingConsentRepository, DatingConsentStore } from '../application/ports.js';

class DrizzleDatingConsentRepository implements DatingConsentRepository {
  constructor(private readonly db: DbExecutor) {}

  async findActiveConsent(userId: string): Promise<ActiveConsent | undefined> {
    const [row] = await this.db
      .select({ id: datingConsents.id, policyVersion: datingConsents.policyVersion })
      .from(datingConsents)
      .where(and(eq(datingConsents.userId, userId), isNull(datingConsents.revokedAt)))
      .limit(1);
    return row;
  }

  async recordConsent(
    userId: string,
    consent: { readonly policyVersion: string; readonly source: ConsentSource; readonly at: Date },
  ): Promise<void> {
    await this.db.insert(datingConsents).values({
      userId,
      policyVersion: consent.policyVersion,
      source: consent.source,
      consentedAt: consent.at,
    });
  }

  async revokeConsent(consentId: string, at: Date): Promise<void> {
    // Never earlier than consented_at: app-server clock skew must not make a
    // withdrawal violate dating_consents_revoked_after_consented_ck and fail.
    await this.db
      .update(datingConsents)
      .set({ revokedAt: sql`GREATEST(${at}::timestamptz, ${datingConsents.consentedAt})` })
      .where(and(eq(datingConsents.id, consentId), isNull(datingConsents.revokedAt)));
  }
}

export class DrizzleDatingConsentStore implements DatingConsentStore {
  readonly repository: DatingConsentRepository;

  constructor(db: Database) {
    this.repository = new DrizzleDatingConsentRepository(db);
  }

  forTransaction(tx: TransactionContext): DatingConsentRepository {
    return new DrizzleDatingConsentRepository(executorOf(tx));
  }
}
