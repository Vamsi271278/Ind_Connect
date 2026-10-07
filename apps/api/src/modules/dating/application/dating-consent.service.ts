import type { AnalyticsTracker } from '../../../shared/analytics/analytics.js';
import type { TransactionContext, UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { OnboardingProgressService } from '../../identity/application/onboarding-progress.service.js';
import type { Clock } from '../../identity/application/ports.js';
import { consentSourceFor, planOptIn, planOptOut } from '../domain/consent.js';
import type { DatingConsentStore } from './ports.js';

/** The profile module's DatingIntentWriter: the only writer of the DATING intent. */
export interface DatingIntentPort {
  isDatingActive(tx: TransactionContext, userId: string): Promise<boolean>;
  activateDating(tx: TransactionContext, userId: string, at: Date): Promise<void>;
  deactivateDating(tx: TransactionContext, userId: string, at: Date): Promise<boolean>;
}

export interface DatingConsentServiceDependencies {
  readonly unitOfWork: UnitOfWork;
  readonly consents: DatingConsentStore;
  readonly datingIntent: DatingIntentPort;
  readonly onboarding: OnboardingProgressService;
  readonly analytics: AnalyticsTracker;
  readonly clock: Clock;
  /** ADR-094 kill switch and the configured policy version. */
  readonly dating: { readonly enabled: boolean; readonly policyVersion: string | null };
}

/**
 * O05 dating consent. Holds the invariant "DATING intent active ⇔ exactly one
 * active dating consent": both change together, in one transaction, under the
 * user row lock. Revoked consents remain as history.
 */
export class DatingConsentService {
  constructor(private readonly deps: DatingConsentServiceDependencies) {}

  /** PUT: affirmative opt-in to the currently configured policy version. Idempotent. */
  async optIn(userId: string, policyVersion: string): Promise<void> {
    const { enabled, policyVersion: currentVersion } = this.deps.dating;
    // Kill switch (T&S §190): no new dating consent while Dating is off.
    if (!enabled || currentVersion === null) throw new ApplicationError('DATING_NOT_ELIGIBLE');

    const enabledSource = await this.deps.unitOfWork.run(async (tx) => {
      // Locks the user and re-checks the account (suspended etc. fail closed).
      const current = await this.deps.onboarding.lockForProfileUpdate(tx, userId);
      this.deps.onboarding.assertIntentAllowed(current);
      if (policyVersion !== currentVersion) {
        throw new ApplicationError('DATING_POLICY_OUTDATED');
      }

      const consents = this.deps.consents.forTransaction(tx);
      const now = this.deps.clock.now();
      const datingActive = await this.deps.datingIntent.isDatingActive(tx, userId);
      const plan = planOptIn(
        await consents.findActiveConsent(userId),
        datingActive,
        currentVersion,
      );
      const source = consentSourceFor(current.status);

      if (plan.revokeConsentId !== null) await consents.revokeConsent(plan.revokeConsentId, now);
      if (plan.recordConsent)
        await consents.recordConsent(userId, { policyVersion, source, at: now });
      if (plan.activateDating) await this.deps.datingIntent.activateDating(tx, userId, now);
      return plan.activateDating ? source : null;
    });

    // After commit, and only when Dating actually turned on.
    if (enabledSource !== null) {
      this.deps.analytics.track({
        name: 'dating_enabled',
        userId,
        source: enabledSource === 'SETTINGS' ? 'settings' : 'onboarding',
      });
    }
  }

  /**
   * DELETE: withdraw consent. NEVER blocked — not by the kill switch, the
   * onboarding step, account status or the one-intent minimum. Idempotent.
   */
  async optOut(userId: string): Promise<void> {
    const disabled = await this.deps.unitOfWork.run(async (tx) => {
      await this.deps.onboarding.lockForConsentWithdrawal(tx, userId);
      const consents = this.deps.consents.forTransaction(tx);
      const now = this.deps.clock.now();
      const datingActive = await this.deps.datingIntent.isDatingActive(tx, userId);
      const plan = planOptOut(await consents.findActiveConsent(userId), datingActive);

      if (plan.revokeConsentId !== null) await consents.revokeConsent(plan.revokeConsentId, now);
      if (plan.deactivateDating) await this.deps.datingIntent.deactivateDating(tx, userId, now);
      return plan.deactivateDating;
    });

    if (disabled) this.deps.analytics.track({ name: 'dating_disabled', userId });
  }
}
