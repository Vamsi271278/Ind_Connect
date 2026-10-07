import type { AnalyticsTracker } from '../../../shared/analytics/analytics.js';
import type { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { OnboardingProgressService } from '../../identity/application/onboarding-progress.service.js';
import type { Clock, OnboardingState } from '../../identity/application/ports.js';
import {
  type InterestCategory,
  INTERESTS_MIN,
  type Language,
  LANGUAGES_MIN,
  type SelectedInterest,
  unavailableCodes,
} from '../domain/taxonomy.js';
import type { TaxonomyStore } from './taxonomy-ports.js';

export interface TaxonomyServiceDependencies {
  readonly unitOfWork: UnitOfWork;
  readonly taxonomy: TaxonomyStore;
  readonly onboarding: OnboardingProgressService;
  readonly analytics: AnalyticsTracker;
  readonly clock: Clock;
}

/**
 * O06 Languages and O07 Interests. Each save is one transaction: lock the user
 * (and re-check the account), require the step, validate EVERY code (any
 * unknown or inactive code fails the whole save, leaving the previous
 * selection unchanged), replace the set, then advance the step.
 */
export class TaxonomyService {
  constructor(private readonly deps: TaxonomyServiceDependencies) {}

  listLanguages(): Promise<readonly Language[]> {
    return this.deps.taxonomy.repository.listActiveLanguages();
  }

  listInterestCatalog(): Promise<readonly InterestCategory[]> {
    return this.deps.taxonomy.repository.listActiveCatalog();
  }

  async updateMyLanguages(
    userId: string,
    codes: readonly string[],
  ): Promise<{ readonly languages: readonly Language[]; readonly onboarding: OnboardingState }> {
    const { result, completedSteps } = await this.deps.unitOfWork.run(async (tx) => {
      const current = await this.deps.onboarding.lockForProfileUpdate(tx, userId);
      this.deps.onboarding.assertStepReached(current, 'LANGUAGE');

      const taxonomy = this.deps.taxonomy.forTransaction(tx);
      const available = new Set((await taxonomy.listActiveLanguages()).map((l) => l.code));
      if (unavailableCodes(codes, available).length > 0) {
        throw new ApplicationError('VALIDATION_FAILED', {
          issues: [{ path: 'languages', code: 'language_not_available' }],
        });
      }
      // The contract enforces the minimum; re-checked here as the domain rule.
      if (codes.length < LANGUAGES_MIN) {
        throw new ApplicationError('VALIDATION_FAILED', {
          issues: [{ path: 'languages', code: 'too_small' }],
        });
      }

      await taxonomy.replaceUserLanguages(userId, codes, this.deps.clock.now());
      const saved = await taxonomy.listUserLanguages(userId);
      const progress = await this.deps.onboarding.recordStepProgress(
        tx,
        userId,
        current,
        'LANGUAGE',
        saved.length >= LANGUAGES_MIN,
      );
      return {
        result: { languages: saved, onboarding: { status: progress.status, step: progress.step } },
        completedSteps: progress.completedSteps,
      };
    });
    this.emitCompleted(userId, completedSteps);
    return result;
  }

  async updateMyInterests(
    userId: string,
    codes: readonly string[],
  ): Promise<{
    readonly interests: readonly SelectedInterest[];
    readonly onboarding: OnboardingState;
  }> {
    const { result, completedSteps } = await this.deps.unitOfWork.run(async (tx) => {
      const current = await this.deps.onboarding.lockForProfileUpdate(tx, userId);
      this.deps.onboarding.assertStepReached(current, 'INTERESTS');

      const taxonomy = this.deps.taxonomy.forTransaction(tx);
      const resolved = await taxonomy.findActiveInterests(codes);
      const available = new Set(resolved.map((i) => i.code));
      if (unavailableCodes(codes, available).length > 0) {
        throw new ApplicationError('VALIDATION_FAILED', {
          issues: [{ path: 'interests', code: 'interest_not_available' }],
        });
      }
      if (resolved.length < INTERESTS_MIN) {
        throw new ApplicationError('VALIDATION_FAILED', {
          issues: [{ path: 'interests', code: 'too_small' }],
        });
      }

      // Codes are the API identity; internal UUIDs are resolved here only.
      await taxonomy.replaceUserInterests(
        userId,
        resolved.map((i) => i.id),
        this.deps.clock.now(),
      );
      const saved = await taxonomy.listUserInterests(userId);
      const progress = await this.deps.onboarding.recordStepProgress(
        tx,
        userId,
        current,
        'INTERESTS',
        saved.length >= INTERESTS_MIN,
      );
      return {
        result: { interests: saved, onboarding: { status: progress.status, step: progress.step } },
        completedSteps: progress.completedSteps,
      };
    });
    this.emitCompleted(userId, completedSteps);
    return result;
  }

  /** After commit only; step codes, never the chosen languages or interests. */
  private emitCompleted(userId: string, completedSteps: readonly string[]): void {
    for (const stepCode of completedSteps) {
      this.deps.analytics.track({ name: 'onboarding_step_completed', userId, stepCode });
    }
  }
}
