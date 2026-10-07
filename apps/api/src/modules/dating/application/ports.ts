import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import type { ActiveConsent, ConsentSource } from '../domain/consent.js';

/** Dating-owned persistence (`dating_consents`): append-only consent evidence. */
export interface DatingConsentRepository {
  findActiveConsent(userId: string): Promise<ActiveConsent | undefined>;
  recordConsent(
    userId: string,
    consent: { readonly policyVersion: string; readonly source: ConsentSource; readonly at: Date },
  ): Promise<void>;
  /** Sets revoked_at on an active consent; never deletes or rewrites history. */
  revokeConsent(consentId: string, at: Date): Promise<void>;
}

export interface DatingConsentStore {
  readonly repository: DatingConsentRepository;
  forTransaction(tx: TransactionContext): DatingConsentRepository;
}

export const DATING_CONSENT_STORE = Symbol('DATING_CONSENT_STORE');
