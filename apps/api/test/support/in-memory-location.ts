import { randomUUID } from 'node:crypto';

import type {
  LocationRepository,
  LocationStore,
} from '../../src/modules/location/application/ports.js';
import type { Snapshottable } from './in-memory-profile.js';
import type {
  City,
  LaunchStatus,
  ManualCityLocation,
} from '../../src/modules/location/domain/location.js';

export interface StoredUserLocation extends ManualCityLocation {
  readonly capturedAt: Date;
  readonly updatedAt: Date;
}

const metro = (code: string, launchStatus: LaunchStatus) => ({
  id: randomUUID(),
  code,
  name: code === 'DFW' ? 'Dallas–Fort Worth' : `${code} metro`,
  countryCode: 'US',
  launchStatus,
});

/** Test double for the location port, seeded with a mix of launch states. */
export class InMemoryLocationStore implements LocationStore, Snapshottable {
  readonly dfw = metro('DFW', 'ACTIVE');
  readonly hou = metro('HOU', 'WAITLIST');

  readonly cities: City[] = [
    this.city('Plano', 'ACTIVE', this.dfw),
    this.city('Frisco', 'ACTIVE', this.dfw),
    this.city('Dallas', 'ACTIVE', this.dfw),
    this.city('Mesquite', 'WAITLIST', this.dfw),
    this.city('Rockwall', 'FUTURE', this.dfw),
    this.city('Garland', 'DISABLED', this.dfw),
    // ACTIVE city in a metro that is not ACTIVE.
    this.city('Houston', 'ACTIVE', this.hou),
  ];

  rows = new Map<string, StoredUserLocation>();

  checkpoint(): () => void {
    const saved = structuredClone(this.rows);
    return () => {
      this.rows = saved;
    };
  }

  private city(name: string, launchStatus: LaunchStatus, inMetro: City['metro']): City {
    return {
      id: randomUUID(),
      name,
      stateRegion: 'TX',
      countryCode: 'US',
      launchStatus,
      metro: inMetro,
    };
  }

  cityNamed(name: string): City {
    const found = this.cities.find((c) => c.name === name);
    if (found === undefined) throw new Error(`no city ${name}`);
    return found;
  }

  readonly repository: LocationRepository = {
    listCities: () => Promise.resolve([...this.cities]),
    findCityForShare: (cityId) => Promise.resolve(this.cities.find((c) => c.id === cityId)),
    findUserCity: (userId) => {
      const row = this.rows.get(userId);
      return Promise.resolve(
        row === undefined ? undefined : this.cities.find((c) => c.id === row.cityId),
      );
    },
    upsertUserLocation: (userId, location, at) => {
      // Same semantics as the PK upsert: one current row, overwritten in place.
      this.rows.set(userId, { ...location, capturedAt: at, updatedAt: at });
      return Promise.resolve();
    },
  };

  forTransaction(): LocationRepository {
    return this.repository;
  }
}
