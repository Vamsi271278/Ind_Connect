import { z } from 'zod';

import { onboardingStatusSchema, onboardingStepSchema } from './enums.js';

/** DATA-MODEL §22/§23 `launch_status`. */
export const LAUNCH_STATUSES = ['ACTIVE', 'WAITLIST', 'FUTURE', 'DISABLED'] as const;
export const launchStatusSchema = z.enum(LAUNCH_STATUSES);
export type LaunchStatus = z.infer<typeof launchStatusSchema>;

// ---------------------------------------------------------------- GET /locations/cities

/**
 * A selectable city (BR-LOC-002). Approved city/metro context only: no
 * coordinates, no centroid, no neighborhood (ADR-058, GR consumer projection).
 */
export const citySchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  stateRegion: z.string(),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  metro: z.strictObject({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
  }),
  launchStatus: launchStatusSchema,
});
export type City = z.infer<typeof citySchema>;

/**
 * Small, bounded launch taxonomy (owner-approved DFW list), so it is returned
 * whole rather than paginated; clients filter locally. Not a people or
 * geocoding search (ADR-045).
 */
export const cityListResponseSchema = z.strictObject({
  cities: z.array(citySchema),
});
export type CityListResponse = z.infer<typeof cityListResponseSchema>;

// ---------------------------------------------------------------- PATCH /users/me/location

/**
 * O03 manual city selection. `cityId` only: metro, country, precision and
 * source are derived by the server; anything else (coordinates, metroId,
 * launchStatus, …) is rejected.
 */
export const updateMyLocationBodySchema = z.strictObject({
  cityId: z.uuid(),
});
export type UpdateMyLocationBody = z.infer<typeof updateMyLocationBodySchema>;

/** The caller's own current location (city/metro only) and onboarding state. */
export const myLocationResponseSchema = z.strictObject({
  location: z.strictObject({
    city: citySchema,
  }),
  onboarding: z.strictObject({
    status: onboardingStatusSchema,
    step: onboardingStepSchema,
  }),
});
export type MyLocationResponse = z.infer<typeof myLocationResponseSchema>;
