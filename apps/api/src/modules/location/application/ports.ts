import type { TransactionContext } from '../../../shared/database/unit-of-work.js';
import type { City, ManualCityLocation } from '../domain/location.js';

/** Location-owned persistence (`metros`, `cities` reads; `user_locations` writes). */
export interface LocationRepository {
  listCities(): Promise<readonly City[]>;
  /** Share-locks the city (and its metro) so its status cannot change before commit. */
  findCityForShare(cityId: string): Promise<City | undefined>;
  /** The user's current city (with metro), if one has been chosen. */
  findUserCity(userId: string): Promise<City | undefined>;
  /** One current row per user, overwritten in place — never a history (ADR-057). */
  upsertUserLocation(userId: string, location: ManualCityLocation, at: Date): Promise<void>;
}

export interface LocationStore {
  readonly repository: LocationRepository;
  forTransaction(tx: TransactionContext): LocationRepository;
}

export const LOCATION_STORE = Symbol('LOCATION_STORE');
