import { describe, expect, it } from 'vitest';

import { buildOpenApiDocument } from './openapi.js';
import {
  cityListResponseSchema,
  citySchema,
  myLocationResponseSchema,
  updateMyLocationBodySchema,
} from './locations.js';

const CITY_ID = '0b5f7f4e-3c1d-4a8e-9f6b-1a2b3c4d5e6f';
const METRO_ID = '7d2c1b0a-9e8f-4d6c-8b5a-4f3e2d1c0b9a';

const city = {
  id: CITY_ID,
  name: 'Frisco',
  stateRegion: 'TX',
  countryCode: 'US',
  metro: { id: METRO_ID, code: 'DFW', name: 'Dallas–Fort Worth' },
  launchStatus: 'ACTIVE',
};

describe('updateMyLocationBodySchema', () => {
  it('accepts exactly a city id', () => {
    expect(updateMyLocationBodySchema.parse({ cityId: CITY_ID })).toEqual({ cityId: CITY_ID });
  });

  it('rejects client-supplied derived, precise or status fields', () => {
    for (const extra of [
      { metroId: METRO_ID },
      { countryCode: 'US' },
      { precisionType: 'DEVICE' },
      { source: 'GPS' },
      { latitude: 33.15, longitude: -96.82 },
      { coordinates: [33.15, -96.82] },
      { launchStatus: 'ACTIVE' },
      { neighborhood: 'Stonebriar' },
      { cityName: 'Frisco' },
    ]) {
      expect(updateMyLocationBodySchema.safeParse({ cityId: CITY_ID, ...extra }).success).toBe(
        false,
      );
    }
  });

  it('rejects missing or malformed ids and free-text cities', () => {
    for (const body of [{}, { cityId: 'Frisco' }, { cityId: '' }, { cityId: 42 }]) {
      expect(updateMyLocationBodySchema.safeParse(body).success).toBe(false);
    }
  });
});

describe('city projection', () => {
  it('accepts city/metro context and refuses coordinates or neighborhood', () => {
    expect(citySchema.safeParse(city).success).toBe(true);
    for (const leak of [
      { latitude: 33.15 },
      { longitude: -96.82 },
      { centroid: [33.15, -96.82] },
      { neighborhood: 'Stonebriar' },
      { createdAt: 'x' },
    ]) {
      expect(citySchema.safeParse({ ...city, ...leak }).success).toBe(false);
    }
    expect(
      citySchema.safeParse({ ...city, metro: { ...city.metro, timezone: 'America/Chicago' } })
        .success,
    ).toBe(false);
  });

  it('wraps the list and the own-location response strictly', () => {
    expect(cityListResponseSchema.safeParse({ cities: [city] }).success).toBe(true);
    const own = {
      location: { city },
      onboarding: { status: 'IN_PROGRESS', step: 'INTENT' },
    };
    expect(myLocationResponseSchema.safeParse(own).success).toBe(true);
    expect(
      myLocationResponseSchema.safeParse({
        ...own,
        location: { city, precisionType: 'MANUAL_CITY', capturedAt: 'x' },
      }).success,
    ).toBe(false);
  });
});

describe('OpenAPI', () => {
  it('documents both location endpoints with bearer auth', () => {
    const paths = buildOpenApiDocument().paths as Record<string, Record<string, unknown>>;
    expect(paths['/api/v1/locations/cities']?.get).toMatchObject({
      operationId: 'listCities',
      security: [{ bearerAuth: [] }],
    });
    expect(paths['/api/v1/users/me/location']?.patch).toMatchObject({
      operationId: 'updateMyLocation',
      security: [{ bearerAuth: [] }],
    });
  });
});
