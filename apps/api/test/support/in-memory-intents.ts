import { randomUUID } from 'node:crypto';

import type {
  DatingConsentRepository,
  DatingConsentStore,
} from '../../src/modules/dating/application/ports.js';
import type { ConsentSource } from '../../src/modules/dating/domain/consent.js';
import type {
  IntentRepository,
  IntentStore,
} from '../../src/modules/profile/application/intent-ports.js';
import {
  type IntentOption,
  TOP_LEVEL_INTENT_CODES,
  type TopLevelIntentCode,
} from '../../src/modules/profile/domain/intents.js';
import type { Snapshottable } from './in-memory-profile.js';

export interface StoredIntent {
  active: boolean;
  selectedAt: Date;
  deselectedAt: Date | null;
}

const OPTIONS: readonly IntentOption[] = [
  { code: 'FRIENDSHIP', label: 'Friendship', description: 'Meet new people.' },
  { code: 'ACTIVITIES', label: 'Activities', description: 'Do things nearby.' },
  { code: 'NETWORKING', label: 'Professional networking', description: 'Connect professionally.' },
  { code: 'DATING', label: 'Dating', description: 'Meet people open to dating.' },
];

/** Test double for `intent_options` + `user_intents` (same semantics as the SQL). */
export class InMemoryIntentStore implements IntentStore, Snapshottable {
  /** userId → intent code → row (rows are kept when deselected). */
  rows = new Map<string, Map<TopLevelIntentCode, StoredIntent>>();
  /** Codes withdrawn from the option list (intent_options.active = false). */
  inactiveOptions = new Set<TopLevelIntentCode>();

  checkpoint(): () => void {
    const saved = structuredClone(this.rows);
    return () => {
      this.rows = saved;
    };
  }

  private userRows(userId: string): Map<TopLevelIntentCode, StoredIntent> {
    let rows = this.rows.get(userId);
    if (rows === undefined) {
      rows = new Map();
      this.rows.set(userId, rows);
    }
    return rows;
  }

  activeOf(userId: string): TopLevelIntentCode[] {
    const rows = this.rows.get(userId);
    return TOP_LEVEL_INTENT_CODES.filter((code) => rows?.get(code)?.active === true);
  }

  readonly repository: IntentRepository = {
    listTopLevelOptions: () =>
      Promise.resolve(OPTIONS.filter((o) => !this.inactiveOptions.has(o.code))),
    listActiveIntents: (userId) => Promise.resolve(this.activeOf(userId)),
    activateIntent: (userId, code, at) => {
      const rows = this.userRows(userId);
      const row = rows.get(code);
      if (row?.active !== true)
        rows.set(code, { active: true, selectedAt: at, deselectedAt: null });
      return Promise.resolve();
    },
    deactivateIntent: (userId, code, at) => {
      const row = this.rows.get(userId)?.get(code);
      if (row?.active !== true) return Promise.resolve(false);
      row.active = false;
      row.deselectedAt = at;
      return Promise.resolve(true);
    },
  };

  forTransaction(): IntentRepository {
    return this.repository;
  }
}

export interface StoredConsent {
  readonly id: string;
  readonly userId: string;
  readonly policyVersion: string;
  readonly source: ConsentSource;
  readonly consentedAt: Date;
  revokedAt: Date | null;
}

/** Test double for `dating_consents`: append-only, one active per user. */
export class InMemoryDatingConsentStore implements DatingConsentStore, Snapshottable {
  rows: StoredConsent[] = [];

  checkpoint(): () => void {
    const saved = structuredClone(this.rows);
    return () => {
      this.rows = saved;
    };
  }

  activeFor(userId: string): StoredConsent[] {
    return this.rows.filter((r) => r.userId === userId && r.revokedAt === null);
  }

  readonly repository: DatingConsentRepository = {
    findActiveConsent: (userId) => {
      const [active] = this.activeFor(userId);
      return Promise.resolve(
        active === undefined ? undefined : { id: active.id, policyVersion: active.policyVersion },
      );
    },
    recordConsent: (userId, consent) => {
      // Mirrors dating_consents_one_active_per_user_uq.
      if (this.activeFor(userId).length > 0) {
        return Promise.reject(new Error('unique violation: one active consent per user'));
      }
      this.rows.push({
        id: randomUUID(),
        userId,
        policyVersion: consent.policyVersion,
        source: consent.source,
        consentedAt: consent.at,
        revokedAt: null,
      });
      return Promise.resolve();
    },
    revokeConsent: (consentId, at) => {
      const row = this.rows.find((r) => r.id === consentId && r.revokedAt === null);
      if (row !== undefined) row.revokedAt = at;
      return Promise.resolve();
    },
  };

  forTransaction(): DatingConsentRepository {
    return this.repository;
  }
}
