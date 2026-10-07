import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import type { IntentOption, TopLevelIntentCode } from '../domain/intents.js';

/** Profile-owned persistence for `intent_options` (read) and `user_intents`. */
export interface IntentRepository {
  /** Active top-level options in display order (sub-intents excluded). */
  listTopLevelOptions(): Promise<readonly IntentOption[]>;
  /** The user's active top-level intents, in option display order. */
  listActiveIntents(userId: string): Promise<readonly TopLevelIntentCode[]>;
  /** Activates (or re-activates) an intent; an already-active row is untouched. */
  activateIntent(userId: string, code: TopLevelIntentCode, at: Date): Promise<void>;
  /** Deactivates an active intent, keeping the row; returns whether it changed. */
  deactivateIntent(userId: string, code: TopLevelIntentCode, at: Date): Promise<boolean>;
}

export interface IntentStore {
  readonly repository: IntentRepository;
  forTransaction(tx: TransactionContext): IntentRepository;
}

export const INTENT_STORE = Symbol('INTENT_STORE');
