import { and, asc, eq, inArray } from 'drizzle-orm';

import type { Database, DbExecutor } from '../../../shared/database/database.module.js';
import { executorOf } from '../../../shared/database/drizzle-unit-of-work.js';
import {
  interestCategories,
  interests,
  languages,
  userInterests,
  userLanguages,
} from '../../../shared/database/schema/index.js';
import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import type {
  InterestCategory,
  Language,
  ResolvedInterest,
  SelectedInterest,
} from '../domain/taxonomy.js';
import type { TaxonomyRepository, TaxonomyStore } from '../application/taxonomy-ports.js';

class DrizzleTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly db: DbExecutor) {}

  async listActiveLanguages(): Promise<readonly Language[]> {
    return this.db
      .select({ code: languages.code, displayName: languages.displayName })
      .from(languages)
      .where(eq(languages.active, true))
      .orderBy(asc(languages.displayOrder));
  }

  async listActiveCatalog(): Promise<readonly InterestCategory[]> {
    const rows = await this.db
      .select({
        categoryCode: interestCategories.code,
        categoryLabel: interestCategories.label,
        code: interests.code,
        label: interests.label,
      })
      .from(interestCategories)
      .innerJoin(interests, eq(interests.categoryId, interestCategories.id))
      .where(and(eq(interestCategories.active, true), eq(interests.active, true)))
      .orderBy(asc(interestCategories.displayOrder), asc(interests.displayOrder));
    const catalog: { code: string; label: string; interests: { code: string; label: string }[] }[] =
      [];
    for (const row of rows) {
      let category = catalog.at(-1);
      if (category?.code !== row.categoryCode) {
        category = { code: row.categoryCode, label: row.categoryLabel, interests: [] };
        catalog.push(category);
      }
      category.interests.push({ code: row.code, label: row.label });
    }
    return catalog;
  }

  async findActiveInterests(codes: readonly string[]): Promise<readonly ResolvedInterest[]> {
    if (codes.length === 0) return [];
    return this.db
      .select({
        id: interests.id,
        code: interests.code,
        label: interests.label,
        categoryCode: interestCategories.code,
      })
      .from(interests)
      .innerJoin(interestCategories, eq(interestCategories.id, interests.categoryId))
      .where(
        and(
          inArray(interests.code, [...codes]),
          eq(interests.active, true),
          eq(interestCategories.active, true),
        ),
      );
  }

  async listUserLanguages(userId: string): Promise<readonly Language[]> {
    return this.db
      .select({ code: languages.code, displayName: languages.displayName })
      .from(userLanguages)
      .innerJoin(languages, eq(languages.code, userLanguages.languageCode))
      .where(eq(userLanguages.userId, userId))
      .orderBy(asc(languages.displayOrder));
  }

  async listUserInterests(userId: string): Promise<readonly SelectedInterest[]> {
    return this.db
      .select({
        code: interests.code,
        label: interests.label,
        categoryCode: interestCategories.code,
      })
      .from(userInterests)
      .innerJoin(interests, eq(interests.id, userInterests.interestId))
      .innerJoin(interestCategories, eq(interestCategories.id, interests.categoryId))
      .where(eq(userInterests.userId, userId))
      .orderBy(asc(interestCategories.displayOrder), asc(interests.displayOrder));
  }

  async replaceUserLanguages(userId: string, codes: readonly string[], at: Date): Promise<void> {
    await this.db.delete(userLanguages).where(eq(userLanguages.userId, userId));
    if (codes.length === 0) return;
    await this.db
      .insert(userLanguages)
      .values(codes.map((languageCode) => ({ userId, languageCode, createdAt: at })));
  }

  async replaceUserInterests(
    userId: string,
    interestIds: readonly string[],
    at: Date,
  ): Promise<void> {
    await this.db.delete(userInterests).where(eq(userInterests.userId, userId));
    if (interestIds.length === 0) return;
    await this.db
      .insert(userInterests)
      .values(interestIds.map((interestId) => ({ userId, interestId, createdAt: at })));
  }
}

export class DrizzleTaxonomyStore implements TaxonomyStore {
  readonly repository: TaxonomyRepository;

  constructor(db: Database) {
    this.repository = new DrizzleTaxonomyRepository(db);
  }

  forTransaction(tx: TransactionContext): TaxonomyRepository {
    return new DrizzleTaxonomyRepository(executorOf(tx));
  }
}
