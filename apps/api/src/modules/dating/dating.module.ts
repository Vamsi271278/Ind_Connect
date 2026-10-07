import { Module } from '@nestjs/common';

import type { AppConfig } from '../../config/app-config.js';
import { APP_CONFIG } from '../../config/config.module.js';
import { ANALYTICS, type AnalyticsTracker } from '../../shared/analytics/analytics.js';
import { type Database, DATABASE } from '../../shared/database/database.module.js';
import { UNIT_OF_WORK, type UnitOfWork } from '../../shared/database/unit-of-work.js';
import { ONBOARDING_PROGRESS } from '../identity/api/tokens.js';
import type { OnboardingProgressService } from '../identity/application/onboarding-progress.service.js';
import { IdentityModule } from '../identity/identity.module.js';
import { DATING_INTENT_WRITER } from '../profile/api/tokens.js';
import type { DatingIntentWriter } from '../profile/application/intent.service.js';
import { ProfileModule } from '../profile/profile.module.js';
import { DatingConsentController } from './api/dating-consent.controller.js';
import { DATING_CONSENT_SERVICE } from './api/tokens.js';
import { DatingConsentService } from './application/dating-consent.service.js';
import { DATING_CONSENT_STORE, type DatingConsentStore } from './application/ports.js';
import { DrizzleDatingConsentStore } from './infrastructure/drizzle-dating-consent.store.js';

/**
 * Dating policy domain: owns `dating_consents` and is the only module that
 * changes the DATING intent (through profile's DatingIntentWriter), always in
 * the same transaction as the consent record.
 */
@Module({
  imports: [IdentityModule, ProfileModule],
  controllers: [DatingConsentController],
  providers: [
    {
      provide: DATING_CONSENT_STORE,
      inject: [DATABASE],
      useFactory: (db: Database): DatingConsentStore => new DrizzleDatingConsentStore(db),
    },
    {
      provide: DATING_CONSENT_SERVICE,
      inject: [
        UNIT_OF_WORK,
        DATING_CONSENT_STORE,
        DATING_INTENT_WRITER,
        ONBOARDING_PROGRESS,
        ANALYTICS,
        APP_CONFIG,
      ],
      useFactory: (
        unitOfWork: UnitOfWork,
        consents: DatingConsentStore,
        datingIntent: DatingIntentWriter,
        onboarding: OnboardingProgressService,
        analytics: AnalyticsTracker,
        config: AppConfig,
      ) =>
        new DatingConsentService({
          unitOfWork,
          consents,
          datingIntent,
          onboarding,
          analytics,
          clock: { now: () => new Date() },
          dating: config.dating,
        }),
    },
  ],
})
export class DatingModule {}
