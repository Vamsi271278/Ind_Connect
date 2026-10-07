import { Module } from '@nestjs/common';

import type { AppConfig } from '../../config/app-config.js';
import { APP_CONFIG } from '../../config/config.module.js';
import { ANALYTICS, type AnalyticsTracker } from '../../shared/analytics/analytics.js';
import { type Database, DATABASE } from '../../shared/database/database.module.js';
import { UNIT_OF_WORK, type UnitOfWork } from '../../shared/database/unit-of-work.js';
import { ONBOARDING_PROGRESS, SELF_ACCOUNT_QUERY } from '../identity/api/tokens.js';
import type { OnboardingProgressService } from '../identity/application/onboarding-progress.service.js';
import type { SelfAccountQuery } from '../identity/application/self-account.query.js';
import { IdentityModule } from '../identity/identity.module.js';
import { LOCATION_QUERY } from '../location/api/tokens.js';
import type { LocationQuery } from '../location/application/location.query.js';
import { LocationModule } from '../location/location.module.js';
import { IntentOptionsController, MyIntentsController } from './api/intents.controller.js';
import { DATING_INTENT_WRITER, INTENT_SERVICE, PROFILE_SERVICE } from './api/tokens.js';
import { UsersController } from './api/users.controller.js';
import { INTENT_STORE, type IntentStore } from './application/intent-ports.js';
import { DatingIntentWriter, IntentService } from './application/intent.service.js';
import { PROFILE_STORE, type ProfileStore } from './application/ports.js';
import { ProfileService } from './application/profile.service.js';
import { DrizzleIntentStore } from './infrastructure/drizzle-intent.store.js';
import { DrizzleProfileStore } from './infrastructure/drizzle-profile.store.js';

const clock = { now: () => new Date() };

/**
 * Profile: owns `user_profiles`, `intent_options` and `user_intents`; reaches
 * identity and location only via their public services. The DATING intent is
 * written only through DATING_INTENT_WRITER, by the dating module.
 */
@Module({
  imports: [IdentityModule, LocationModule],
  controllers: [UsersController, IntentOptionsController, MyIntentsController],
  providers: [
    {
      provide: PROFILE_STORE,
      inject: [DATABASE],
      useFactory: (db: Database): ProfileStore => new DrizzleProfileStore(db),
    },
    {
      provide: INTENT_STORE,
      inject: [DATABASE],
      useFactory: (db: Database): IntentStore => new DrizzleIntentStore(db),
    },
    {
      provide: PROFILE_SERVICE,
      inject: [
        UNIT_OF_WORK,
        PROFILE_STORE,
        INTENT_STORE,
        ONBOARDING_PROGRESS,
        SELF_ACCOUNT_QUERY,
        LOCATION_QUERY,
        ANALYTICS,
      ],
      useFactory: (
        unitOfWork: UnitOfWork,
        profiles: ProfileStore,
        intents: IntentStore,
        onboarding: OnboardingProgressService,
        selfAccount: SelfAccountQuery,
        locations: LocationQuery,
        analytics: AnalyticsTracker,
      ) =>
        new ProfileService({
          unitOfWork,
          profiles,
          intents,
          onboarding,
          selfAccount,
          locations,
          analytics,
          clock,
        }),
    },
    {
      provide: INTENT_SERVICE,
      inject: [UNIT_OF_WORK, INTENT_STORE, ONBOARDING_PROGRESS, ANALYTICS, APP_CONFIG],
      useFactory: (
        unitOfWork: UnitOfWork,
        intents: IntentStore,
        onboarding: OnboardingProgressService,
        analytics: AnalyticsTracker,
        config: AppConfig,
      ) =>
        new IntentService({
          unitOfWork,
          intents,
          onboarding,
          analytics,
          clock,
          dating: config.dating,
        }),
    },
    {
      provide: DATING_INTENT_WRITER,
      inject: [INTENT_STORE],
      useFactory: (intents: IntentStore) => new DatingIntentWriter(intents),
    },
  ],
  exports: [DATING_INTENT_WRITER],
})
export class ProfileModule {}
