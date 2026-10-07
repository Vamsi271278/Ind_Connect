import type { AnalyticsTracker } from '../../../shared/analytics/analytics.js';
import type { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';
import type { OnboardingProgressService } from '../../identity/application/onboarding-progress.service.js';
import type { Clock, OnboardingState } from '../../identity/application/ports.js';
import { byCityName, type City, isSelectableCity, manualLocationFor } from '../domain/location.js';
import type { LocationStore } from './ports.js';

export interface MyLocationView {
  readonly city: City;
  readonly onboarding: OnboardingState;
}

export interface LocationServiceDependencies {
  readonly unitOfWork: UnitOfWork;
  readonly locations: LocationStore;
  readonly onboarding: OnboardingProgressService;
  readonly analytics: AnalyticsTracker;
  readonly clock: Clock;
}

export class LocationService {
  constructor(private readonly deps: LocationServiceDependencies) {}

  /** O03 choices: selectable cities only, by name. */
  async listSelectableCities(): Promise<readonly City[]> {
    const cities = await this.deps.locations.repository.listCities();
    return cities.filter(isSelectableCity).sort(byCityName);
  }

  /**
   * One transaction: lock the user (identity), require onboarding to have
   * reached LOCATION, validate the city, overwrite the current location, then
   * let identity apply LOCATION → INTENT. All of it commits or none of it does.
   */
  async updateMyLocation(userId: string, cityId: string): Promise<MyLocationView> {
    const { view, completedSteps } = await this.deps.unitOfWork.run(async (tx) => {
      const current = await this.deps.onboarding.lockForProfileUpdate(tx, userId);
      // Before any read or write of location data (data minimisation).
      this.deps.onboarding.assertLocationAllowed(current);

      const locations = this.deps.locations.forTransaction(tx);
      const city = await locations.findCityForShare(cityId);
      // Unknown and unavailable cities are indistinguishable to the client.
      if (city === undefined || !isSelectableCity(city)) {
        throw new ApplicationError('CITY_NOT_AVAILABLE');
      }
      await locations.upsertUserLocation(userId, manualLocationFor(city), this.deps.clock.now());
      const progress = await this.deps.onboarding.recordLocationProgress(tx, userId, current);
      return {
        view: { city, onboarding: { status: progress.status, step: progress.step } },
        completedSteps: progress.completedSteps,
      };
    });

    // After commit only; step codes, never the city (Analytics §2.4).
    for (const stepCode of completedSteps) {
      this.deps.analytics.track({ name: 'onboarding_step_completed', userId, stepCode });
    }
    return view;
  }
}
