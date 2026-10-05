import { Module } from '@nestjs/common';

import { ANALYTICS, type AnalyticsTracker } from '../../shared/analytics/analytics.js';
import { type Database, DATABASE } from '../../shared/database/database.module.js';
import { UNIT_OF_WORK, type UnitOfWork } from '../../shared/database/unit-of-work.js';
import { ONBOARDING_PROGRESS, SELF_ACCOUNT_QUERY } from '../identity/api/tokens.js';
import type { OnboardingProgressService } from '../identity/application/onboarding-progress.service.js';
import type { SelfAccountQuery } from '../identity/application/self-account.query.js';
import { IdentityModule } from '../identity/identity.module.js';
import { UsersController } from './api/users.controller.js';
import { PROFILE_SERVICE } from './api/tokens.js';
import { PROFILE_STORE, type ProfileStore } from './application/ports.js';
import { ProfileService } from './application/profile.service.js';
import { DrizzleProfileStore } from './infrastructure/drizzle-profile.store.js';

/** Profile: owns `user_profiles`; reaches identity only via its public services. */
@Module({
  imports: [IdentityModule],
  controllers: [UsersController],
  providers: [
    {
      provide: PROFILE_STORE,
      inject: [DATABASE],
      useFactory: (db: Database): ProfileStore => new DrizzleProfileStore(db),
    },
    {
      provide: PROFILE_SERVICE,
      inject: [UNIT_OF_WORK, PROFILE_STORE, ONBOARDING_PROGRESS, SELF_ACCOUNT_QUERY, ANALYTICS],
      useFactory: (
        unitOfWork: UnitOfWork,
        profiles: ProfileStore,
        onboarding: OnboardingProgressService,
        selfAccount: SelfAccountQuery,
        analytics: AnalyticsTracker,
      ) =>
        new ProfileService({
          unitOfWork,
          profiles,
          onboarding,
          selfAccount,
          analytics,
          clock: { now: () => new Date() },
        }),
    },
  ],
})
export class ProfileModule {}
