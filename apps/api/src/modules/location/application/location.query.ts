import type { City } from '../domain/location.js';
import type { LocationStore } from './ports.js';

/**
 * Location's public read for other modules (the self projection). Returns the
 * stored city/metro only; there are no coordinates to return.
 */
export class LocationQuery {
  constructor(private readonly locations: LocationStore) {}

  findMyCity(userId: string): Promise<City | undefined> {
    return this.locations.repository.findUserCity(userId);
  }
}
