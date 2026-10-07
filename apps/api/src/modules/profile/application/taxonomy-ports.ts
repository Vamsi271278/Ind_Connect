import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import type {
  InterestCategory,
  Language,
  ResolvedInterest,
  SelectedInterest,
} from '../domain/taxonomy.js';

/** Profile-owned persistence for languages and interests (reference data + selections). */
export interface TaxonomyRepository {
  /** Active languages in display order. */
  listActiveLanguages(): Promise<readonly Language[]>;
  /** Active categories (display order), each with its active interests (display order). */
  listActiveCatalog(): Promise<readonly InterestCategory[]>;
  /** The active interests (in active categories) among `codes`; others are omitted. */
  findActiveInterests(codes: readonly string[]): Promise<readonly ResolvedInterest[]>;

  listUserLanguages(userId: string): Promise<readonly Language[]>;
  listUserInterests(userId: string): Promise<readonly SelectedInterest[]>;
  /** Makes exactly `codes` the user's languages (call inside the save transaction). */
  replaceUserLanguages(userId: string, codes: readonly string[], at: Date): Promise<void>;
  /** Makes exactly `interestIds` the user's interests (call inside the save transaction). */
  replaceUserInterests(userId: string, interestIds: readonly string[], at: Date): Promise<void>;
}

export interface TaxonomyStore {
  readonly repository: TaxonomyRepository;
  forTransaction(tx: TransactionContext): TaxonomyRepository;
}

export const TAXONOMY_STORE = Symbol('TAXONOMY_STORE');
