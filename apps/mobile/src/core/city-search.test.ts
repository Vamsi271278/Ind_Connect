import type { City } from '@project-connect/api-contracts';
import { describe, expect, it } from 'vitest';

import { cityLabel, filterCities } from './city-search';

const city = (name: string): City => ({
  id: '0b5f7f4e-3c1d-4a8e-9f6b-1a2b3c4d5e6f',
  name,
  stateRegion: 'TX',
  countryCode: 'US',
  metro: { id: '7d2c1b0a-9e8f-4d6c-8b5a-4f3e2d1c0b9a', code: 'DFW', name: 'Dallas–Fort Worth' },
  launchStatus: 'ACTIVE',
});

const CITIES = ['Dallas', 'Fort Worth', 'Frisco', 'McKinney', 'Plano', 'Prosper'].map(city);
const names = (query: string) => filterCities(CITIES, query).map((c) => c.name);

describe('filterCities', () => {
  it('returns everything for an empty or blank query', () => {
    expect(names('')).toHaveLength(CITIES.length);
    expect(names('   ')).toHaveLength(CITIES.length);
  });

  it('matches word prefixes, case- and accent-insensitively', () => {
    expect(names('fr')).toEqual(['Frisco']);
    expect(names('wor')).toEqual(['Fort Worth']);
    expect(names('FORT  w')).toEqual(['Fort Worth']);
    expect(names('mckínney')).toEqual(['McKinney']);
    expect(names('p')).toEqual(['Plano', 'Prosper']);
  });

  it('accepts the displayed "City, ST" label', () => {
    expect(names('Plano, TX')).toEqual(['Plano']);
    expect(names('plano tx')).toEqual(['Plano']);
  });

  it('finds nothing for unsupported places (no free-text city)', () => {
    expect(names('Houston')).toEqual([]);
    expect(names('lano')).toEqual([]);
  });
});

describe('cityLabel', () => {
  it('shows city and state only', () => {
    expect(cityLabel(city('Frisco'))).toBe('Frisco, TX');
  });
});
