import { Module } from '@nestjs/common';

import { ANALYTICS, type AnalyticsTracker } from '../../shared/analytics/analytics.js';
import { type Database, DATABASE } from '../../shared/database/database.module.js';
import { UNIT_OF_WORK, type UnitOfWork } from '../../shared/database/unit-of-work.js';
import { ONBOARDING_PROGRESS } from '../identity/api/tokens.js';
import type { OnboardingProgressService } from '../identity/application/onboarding-progress.service.js';
import { IdentityModule } from '../identity/identity.module.js';
import { LocationsController, MyLocationController } from './api/location.controllers.js';
import { LOCATION_QUERY, LOCATION_SERVICE } from './api/tokens.js';
import { LocationQuery } from './application/location.query.js';
import { LocationService } from './application/location.service.js';
import { LOCATION_STORE, type LocationStore } from './application/ports.js';
import { DrizzleLocationStore } from './infrastructure/drizzle-location.store.js';

/**
 * Location: owns `metros`, `cities` and `user_locations`; reaches identity
 * only via its public onboarding service (identity alone writes onboarding).
 */
@Module({
  imports: [IdentityModule],
  controllers: [LocationsController, MyLocationController],
  providers: [
    {
      provide: LOCATION_STORE,
      inject: [DATABASE],
      useFactory: (db: Database): LocationStore => new DrizzleLocationStore(db),
    },
    {
      provide: LOCATION_QUERY,
      inject: [LOCATION_STORE],
      useFactory: (locations: LocationStore) => new LocationQuery(locations),
    },
    {
      provide: LOCATION_SERVICE,
      inject: [UNIT_OF_WORK, LOCATION_STORE, ONBOARDING_PROGRESS, ANALYTICS],
      useFactory: (
        unitOfWork: UnitOfWork,
        locations: LocationStore,
        onboarding: OnboardingProgressService,
        analytics: AnalyticsTracker,
      ) =>
        new LocationService({
          unitOfWork,
          locations,
          onboarding,
          analytics,
          clock: { now: () => new Date() },
        }),
    },
  ],
  exports: [LOCATION_QUERY],
})
export class LocationModule {}
