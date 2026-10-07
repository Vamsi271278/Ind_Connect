import { randomUUID } from 'node:crypto';

import type {
  TaxonomyRepository,
  TaxonomyStore,
} from '../../src/modules/profile/application/taxonomy-ports.js';
import type { Language, ResolvedInterest } from '../../src/modules/profile/domain/taxonomy.js';
import type { Snapshottable } from './in-memory-profile.js';

interface StoredInterest extends ResolvedInterest {
  readonly order: number;
}

const LANGUAGES: readonly Language[] = [
  { code: 'en', displayName: 'English' },
  { code: 'te', displayName: 'Telugu' },
  { code: 'ta', displayName: 'Tamil' },
  { code: 'hi', displayName: 'Hindi' },
];

const CATEGORIES = [
  { code: 'SPORTS', label: 'Sports', interests: ['CRICKET', 'BADMINTON', 'TENNIS'] },
  { code: 'OUTDOORS', label: 'Outdoors', interests: ['HIKING', 'CAMPING'] },
] as const;

/** Test double for the taxonomy port: same validation and replace semantics as SQL. */
export class InMemoryTaxonomyStore implements TaxonomyStore, Snapshottable {
  readonly inactiveLanguages = new Set<string>();
  readonly inactiveInterests = new Set<string>();
  private readonly interests: StoredInterest[] = CATEGORIES.flatMap((c, ci) =>
    c.interests.map((code, ii) => ({
      id: randomUUID(),
      code,
      label: code.charAt(0) + code.slice(1).toLowerCase(),
      categoryCode: c.code,
      order: ci * 100 + ii,
    })),
  );

  userLanguages = new Map<string, string[]>();
  userInterests = new Map<string, string[]>();

  checkpoint(): () => void {
    const languages = structuredClone(this.userLanguages);
    const interests = structuredClone(this.userInterests);
    return () => {
      this.userLanguages = languages;
      this.userInterests = interests;
    };
  }

  languagesOf(userId: string): string[] {
    return this.userLanguages.get(userId) ?? [];
  }

  interestCodesOf(userId: string): string[] {
    const ids = this.userInterests.get(userId) ?? [];
    return this.interests.filter((i) => ids.includes(i.id)).map((i) => i.code);
  }

  readonly repository: TaxonomyRepository = {
    listActiveLanguages: () =>
      Promise.resolve(LANGUAGES.filter((l) => !this.inactiveLanguages.has(l.code))),
    listActiveCatalog: () =>
      Promise.resolve(
        CATEGORIES.map((c) => ({
          code: c.code,
          label: c.label,
          interests: this.interests
            .filter((i) => i.categoryCode === c.code && !this.inactiveInterests.has(i.code))
            .map((i) => ({ code: i.code, label: i.label })),
        })),
      ),
    findActiveInterests: (codes) =>
      Promise.resolve(
        this.interests
          .filter((i) => codes.includes(i.code) && !this.inactiveInterests.has(i.code))
          .map(({ id, code, label, categoryCode }) => ({ id, code, label, categoryCode })),
      ),
    listUserLanguages: (userId) =>
      Promise.resolve(LANGUAGES.filter((l) => this.languagesOf(userId).includes(l.code))),
    listUserInterests: (userId) => {
      const ids = this.userInterests.get(userId) ?? [];
      return Promise.resolve(
        this.interests
          .filter((i) => ids.includes(i.id))
          .sort((a, b) => a.order - b.order)
          .map(({ code, label, categoryCode }) => ({ code, label, categoryCode })),
      );
    },
    replaceUserLanguages: (userId, codes) => {
      this.userLanguages.set(userId, [...codes]);
      return Promise.resolve();
    },
    replaceUserInterests: (userId, ids) => {
      this.userInterests.set(userId, [...ids]);
      return Promise.resolve();
    },
  };

  forTransaction(): TaxonomyRepository {
    return this.repository;
  }
}
