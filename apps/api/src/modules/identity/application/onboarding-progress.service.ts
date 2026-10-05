import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import type { OnboardingStep } from '../domain/account.js';
import { nextOnboardingState, type OnboardingProfileFacts } from '../domain/onboarding-progress.js';
import type { Clock, IdentityStore, OnboardingState } from './ports.js';

/**
 * Identity's public onboarding service. Other modules call it inside a shared
 * UnitOfWork transaction; only identity writes `users.onboarding_*`.
 */
export class OnboardingProgressService {
  constructor(
    private readonly store: IdentityStore,
    private readonly clock: Clock,
  ) {}

  /**
   * Locks the user's row for the rest of the transaction, serializing every
   * profile/onboarding write for that user.
   */
  async lockForProfileUpdate(tx: TransactionContext, userId: string): Promise<OnboardingState> {
    const state = await this.store.forTransaction(tx).lockOnboarding(userId);
    if (state === undefined) throw new ApplicationError('AUTH_REQUIRED');
    return state;
  }

  /** Applies the deterministic progression rule; returns the steps completed. */
  async recordProfileProgress(
    tx: TransactionContext,
    userId: string,
    current: OnboardingState,
    facts: OnboardingProfileFacts,
  ): Promise<{
    readonly step: OnboardingStep;
    readonly completedSteps: readonly OnboardingStep[];
  }> {
    const next = nextOnboardingState(current, facts);
    if (next.step !== current.step || next.status !== current.status) {
      await this.store
        .forTransaction(tx)
        .updateOnboarding(userId, { status: next.status, step: next.step }, this.clock.now());
    }
    return { step: next.step, completedSteps: next.completedSteps };
  }
}
