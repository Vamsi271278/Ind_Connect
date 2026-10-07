import type { City } from '@project-connect/api-contracts';

/** Case- and accent-insensitive comparison form ("Mckínney" ~ "mckinney"). */
const fold = (value: string): string =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/gu, ' ').trim();

/** "Frisco, TX" — the only way a city is shown (city, not exact location). */
export const cityLabel = (city: City): string => `${city.name}, ${city.stateRegion}`;

/**
 * Local filter over the server's selectable list. A city matches when any word
 * of its name (or the whole "Name, ST" label) starts with the query, so "wor"
 * finds Fort Worth and "fort w" narrows to it. Never a server or geocoding call.
 */
export function filterCities(cities: readonly City[], query: string): readonly City[] {
  const q = fold(query).replace(/,/gu, '');
  if (q === '') return cities;
  return cities.filter((city) => {
    const label = fold(cityLabel(city)).replace(/,/gu, '');
    return label.startsWith(q) || label.split(' ').some((word) => word.startsWith(q));
  });
}
