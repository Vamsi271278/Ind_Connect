import type { AnalyticsTracker } from '../../../shared/analytics/analytics.js';
import type { TransactionContext, UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { OnboardingProgressService } from '../../identity/application/onboarding-progress.service.js';
import type { Clock, OnboardingState } from '../../identity/application/ports.js';
import {
  DATING_INTENT,
  type IntentOption,
  offeredIntentOptions,
  type SocialIntentCode,
  socialIntentChanges,
  type TopLevelIntentCode,
} from '../domain/intents.js';
import type { IntentStore } from './intent-ports.js';

/** The Dating kill switch and policy version, from server configuration. */
export interface DatingAvailability {
  readonly enabled: boolean;
  readonly policyVersion: string | null;
}

export interface IntentOptionsView {
  readonly options: readonly IntentOption[];
  readonly dating: { readonly policyVersion: string } | null;
}

export interface MyIntentsView {
  readonly activeIntents: readonly TopLevelIntentCode[];
  readonly onboarding: OnboardingState;
}

export interface IntentServiceDependencies {
  readonly unitOfWork: UnitOfWork;
  readonly intents: IntentStore;
  readonly onboarding: OnboardingProgressService;
  readonly analytics: AnalyticsTracker;
  readonly clock: Clock;
  readonly dating: DatingAvailability;
}

/** O04 social intents. DATING is read here but written only by the dating module. */
export class IntentService {
  constructor(private readonly deps: IntentServiceDependencies) {}

  async listOptions(): Promise<IntentOptionsView> {
    const { enabled, policyVersion } = this.deps.dating;
    const options = await this.deps.intents.repository.listTopLevelOptions();
    return {
      options: offeredIntentOptions(options, enabled),
      dating: enabled && policyVersion !== null ? { policyVersion } : null,
    };
  }

  listActiveIntents(userId: string): Promise<readonly TopLevelIntentCode[]> {
    return this.deps.intents.repository.listActiveIntents(userId);
  }

  /**
   * One transaction: lock the user (and re-check the account), require INTENT,
   * make exactly `requested` the active social intents (DATING untouched),
   * require ≥1 active intent overall, then let identity apply INTENT → LANGUAGE.
   */
  async updateMyIntents(
    userId: string,
    requested: readonly SocialIntentCode[],
  ): Promise<MyIntentsView> {
    const { view, completedSteps } = await this.deps.unitOfWork.run(async (tx) => {
      const current = await this.deps.onboarding.lockForProfileUpdate(tx, userId);
      this.deps.onboarding.assertIntentAllowed(current);

      const intents = this.deps.intents.forTransaction(tx);
      const offered = new Set<string>((await intents.listTopLevelOptions()).map((o) => o.code));
      if (requested.some((code) => !offered.has(code))) {
        // A withdrawn (inactive) option cannot be newly chosen.
        throw new ApplicationError('VALIDATION_FAILED', {
          issues: [{ path: 'intents', code: 'intent_not_available' }],
        });
      }

      const now = this.deps.clock.now();
      const changes = socialIntentChanges(await intents.listActiveIntents(userId), requested);
      for (const code of changes.activate) await intents.activateIntent(userId, code, now);
      for (const code of changes.deactivate) await intents.deactivateIntent(userId, code, now);

      const activeIntents = await intents.listActiveIntents(userId);
      // BR-INT-001: an ordinary edit may never leave the profile without an
      // intent. (Only consent withdrawal may, and it never comes through here.)
      if (activeIntents.length === 0) throw new ApplicationError('INTENT_REQUIRED');

      const progress = await this.deps.onboarding.recordIntentProgress(
        tx,
        userId,
        current,
        activeIntents.length,
      );
      return {
        view: { activeIntents, onboarding: { status: progress.status, step: progress.step } },
        completedSteps: progress.completedSteps,
      };
    });

    // After commit only; step codes, never the chosen intents (Analytics §2.4).
    for (const stepCode of completedSteps) {
      this.deps.analytics.track({ name: 'onboarding_step_completed', userId, stepCode });
    }
    return view;
  }
}

/**
 * The ONLY way to change the DATING intent, for the dating module's use inside
 * its own transaction, together with the consent record. Keeps
 * "DATING active ⇔ exactly one active dating consent" in one place.
 */
export class DatingIntentWriter {
  constructor(private readonly intents: IntentStore) {}

  async isDatingActive(tx: TransactionContext, userId: string): Promise<boolean> {
    const active = await this.intents.forTransaction(tx).listActiveIntents(userId);
    return active.includes(DATING_INTENT);
  }

  activateDating(tx: TransactionContext, userId: string, at: Date): Promise<void> {
    return this.intents.forTransaction(tx).activateIntent(userId, DATING_INTENT, at);
  }

  deactivateDating(tx: TransactionContext, userId: string, at: Date): Promise<boolean> {
    return this.intents.forTransaction(tx).deactivateIntent(userId, DATING_INTENT, at);
  }
}
