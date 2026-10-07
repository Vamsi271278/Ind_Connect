import type { AnalyticsTracker } from '../../../shared/analytics/analytics.js';
import type { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { OnboardingProgressService } from '../../identity/application/onboarding-progress.service.js';
import type { Clock } from '../../identity/application/ports.js';
import type {
  SelfAccountQuery,
  SelfAccountView,
} from '../../identity/application/self-account.query.js';
import {
  EMPTY_PROFILE,
  mergeProfile,
  type ProfilePatch,
  type ProfileState,
} from '../domain/profile.js';
import { DATING_INTENT, type TopLevelIntentCode } from '../domain/intents.js';
import type { IntentStore } from './intent-ports.js';
import type { ProfileStore } from './ports.js';

/** SelfUserDto content (AUTHORIZATION §XLI); shaped by the contract at the edge. */
export interface SelfUserView {
  readonly id: string;
  readonly accountStatus: SelfAccountView['accountStatus'];
  readonly onboarding: {
    readonly status: SelfAccountView['onboardingStatus'];
    readonly step: SelfAccountView['onboardingStep'];
  };
  readonly profile: ProfileState;
  readonly phoneMasked: string;
  readonly age: number;
  /** Saved onboarding choices, self-only (restores O03/O04 state). */
  readonly location: { readonly city: SelfCityView } | null;
  readonly activeIntents: readonly TopLevelIntentCode[];
  /**
   * Derived from the DATING intent, which is active only with an active
   * consent. Self projection only; consent details are never exposed.
   */
  readonly datingEnabled: boolean;
}

/** The saved city as the self projection needs it (city/metro context only). */
export interface SelfCityView {
  readonly id: string;
  readonly name: string;
  readonly stateRegion: string;
  readonly countryCode: string;
  readonly launchStatus: 'ACTIVE' | 'WAITLIST' | 'FUTURE' | 'DISABLED';
  readonly metro: { readonly id: string; readonly code: string; readonly name: string };
}

/** Satisfied by the location module's public LocationQuery. */
export interface MyCityReader {
  findMyCity(userId: string): Promise<SelfCityView | undefined>;
}

export interface ProfileServiceDependencies {
  readonly unitOfWork: UnitOfWork;
  readonly profiles: ProfileStore;
  readonly onboarding: OnboardingProgressService;
  readonly selfAccount: SelfAccountQuery;
  readonly locations: MyCityReader;
  readonly intents: IntentStore;
  readonly analytics: AnalyticsTracker;
  readonly clock: Clock;
}

export class ProfileService {
  constructor(private readonly deps: ProfileServiceDependencies) {}

  async getMe(userId: string): Promise<SelfUserView> {
    const [account, profile, city, activeIntents] = await Promise.all([
      this.deps.selfAccount.getSelfAccount(userId),
      this.deps.profiles.repository.findProfile(userId),
      this.deps.locations.findMyCity(userId),
      this.deps.intents.repository.listActiveIntents(userId),
    ]);
    return {
      id: account.id,
      accountStatus: account.accountStatus,
      onboarding: { status: account.onboardingStatus, step: account.onboardingStep },
      profile: profile ?? EMPTY_PROFILE,
      phoneMasked: account.phoneMasked,
      age: account.age,
      location: city === undefined ? null : { city },
      activeIntents,
      datingEnabled: activeIntents.includes(DATING_INTENT),
    };
  }

  /**
   * One transaction: lock the user (identity), merge and write the profile
   * (profile), then let identity apply the onboarding progression rule. Either
   * all of it commits or none of it does.
   */
  async updateMyProfile(userId: string, patch: ProfilePatch): Promise<SelfUserView> {
    const completedSteps = await this.deps.unitOfWork.run(async (tx) => {
      const onboarding = await this.deps.onboarding.lockForProfileUpdate(tx, userId);
      const profiles = this.deps.profiles.forTransaction(tx);
      const current = (await profiles.findProfile(userId)) ?? EMPTY_PROFILE;

      const merged = mergeProfile(current, patch);
      if (!merged.ok) {
        throw new ApplicationError('VALIDATION_FAILED', { issues: [merged.issue] });
      }
      await profiles.upsertProfile(userId, merged.state, this.deps.clock.now());
      const progress = await this.deps.onboarding.recordProfileProgress(
        tx,
        userId,
        onboarding,
        merged.state,
      );
      return progress.completedSteps;
    });

    // After commit only; step codes, never profile values (Analytics §2.4).
    for (const stepCode of completedSteps) {
      this.deps.analytics.track({ name: 'onboarding_step_completed', userId, stepCode });
    }
    return this.getMe(userId);
  }
}
