/** DATA-MODEL §22/§23 launch states; the single source of city/metro availability. */
export const LAUNCH_STATUSES = ['ACTIVE', 'WAITLIST', 'FUTURE', 'DISABLED'] as const;
export type LaunchStatus = (typeof LAUNCH_STATUSES)[number];

export const isLaunchStatus = (value: string): value is LaunchStatus =>
  (LAUNCH_STATUSES as readonly string[]).includes(value);

/** A city with its metro, as stored. Reference data: no coordinates. */
export interface City {
  readonly id: string;
  readonly name: string;
  readonly stateRegion: string;
  readonly countryCode: string;
  readonly launchStatus: LaunchStatus;
  readonly metro: {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly countryCode: string;
    readonly launchStatus: LaunchStatus;
  };
}

/**
 * A city can be chosen only when both it and its metro are ACTIVE. WAITLIST,
 * FUTURE and DISABLED are never selectable in B4.1 (no waitlist workflow yet).
 */
export const isSelectableCity = (city: City): boolean =>
  city.launchStatus === 'ACTIVE' && city.metro.launchStatus === 'ACTIVE';

/**
 * The stored current location for a manual city choice (B4.1: the only kind).
 * Metro and country always come from the city, never from the client.
 */
export interface ManualCityLocation {
  readonly cityId: string;
  readonly metroId: string;
  readonly countryCode: string;
  readonly precisionType: 'MANUAL_CITY';
  readonly source: 'MANUAL';
}

export const manualLocationFor = (city: City): ManualCityLocation => ({
  cityId: city.id,
  metroId: city.metro.id,
  countryCode: city.countryCode,
  precisionType: 'MANUAL_CITY',
  source: 'MANUAL',
});

/** Display order for the city list: by name, locale-independent. */
export const byCityName = (a: City, b: City): number =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
