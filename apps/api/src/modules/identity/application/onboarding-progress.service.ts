import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import { canUseSelfService, type OnboardingStep } from '../domain/account.js';
import {
  hasReachedLocationStep,
  nextOnboardingState,
  nextOnboardingStateAfterLocation,
  type OnboardingProfileFacts,
} from '../domain/onboarding-progress.js';
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
   * profile/location/onboarding write for that user. Re-checks the account
   * status under the lock, so a restriction that committed after request
   * authentication still fails the write closed.
   */
  async lockForProfileUpdate(tx: TransactionContext, userId: string): Promise<OnboardingState> {
    const state = await this.store.forTransaction(tx).lockOnboarding(userId);
    if (state === undefined) throw new ApplicationError('AUTH_REQUIRED');
    if (!canUseSelfService(state.accountStatus)) throw new ApplicationError('ACCOUNT_NOT_ACTIVE');
    return { status: state.status, step: state.step };
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

  /**
   * Fails closed unless onboarding has reached LOCATION. Call with the state
   * returned by `lockForProfileUpdate`, before writing any location data.
   */
  assertLocationAllowed(current: OnboardingState): void {
    if (!hasReachedLocationStep(current.step)) {
      throw new ApplicationError('ONBOARDING_STEP_NOT_REACHED');
    }
  }

  /** After the location write: LOCATION → INTENT; later steps are untouched. */
  async recordLocationProgress(
    tx: TransactionContext,
    userId: string,
    current: OnboardingState,
  ): Promise<{
    readonly status: OnboardingState['status'];
    readonly step: OnboardingStep;
    readonly completedSteps: readonly OnboardingStep[];
  }> {
    this.assertLocationAllowed(current);
    const next = nextOnboardingStateAfterLocation(current);
    if (next.step !== current.step || next.status !== current.status) {
      await this.store
        .forTransaction(tx)
        .updateOnboarding(userId, { status: next.status, step: next.step }, this.clock.now());
    }
    return next;
  }
}
