import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import {
  type City as CityDto,
  type CityListResponse,
  cityListResponseSchema,
  type MyLocationResponse,
  myLocationResponseSchema,
  updateMyLocationBodySchema,
} from '@project-connect/api-contracts';

import { parseInput, shapeResponse } from '../../../shared/http/parse.js';
import { AccessTokenGuard, CurrentAuth } from '../../identity/api/auth.guard.js';
import type { AuthContext } from '../../identity/application/session.service.js';
import type { LocationService } from '../application/location.service.js';
import type { City } from '../domain/location.js';
import { LOCATION_SERVICE } from './tokens.js';

/** Explicit consumer projection: city/metro context only, never coordinates. */
const toCityDto = (city: City): CityDto => ({
  id: city.id,
  name: city.name,
  stateRegion: city.stateRegion,
  countryCode: city.countryCode,
  metro: { id: city.metro.id, code: city.metro.code, name: city.metro.name },
  launchStatus: city.launchStatus,
});

/** `/api/v1/locations/*`. Signed-in self-service accounts (guard default). */
@Controller('locations')
@UseGuards(AccessTokenGuard)
export class LocationsController {
  constructor(@Inject(LOCATION_SERVICE) private readonly locations: LocationService) {}

  @Get('cities')
  async listCities(): Promise<CityListResponse> {
    const cities = await this.locations.listSelectableCities();
    return shapeResponse(cityListResponseSchema, { cities: cities.map(toCityDto) });
  }
}

/**
 * `/api/v1/users/me/location`. Self only: the user comes from the server
 * session; the body carries a city id and nothing else.
 */
@Controller('users/me/location')
@UseGuards(AccessTokenGuard)
export class MyLocationController {
  constructor(@Inject(LOCATION_SERVICE) private readonly locations: LocationService) {}

  @Patch()
  async updateMyLocation(
    @CurrentAuth() auth: AuthContext,
    @Body() body: unknown,
  ): Promise<MyLocationResponse> {
    const { cityId } = parseInput(updateMyLocationBodySchema, body);
    const view = await this.locations.updateMyLocation(auth.userId, cityId);
    return shapeResponse(myLocationResponseSchema, {
      location: { city: toCityDto(view.city) },
      onboarding: view.onboarding,
    });
  }
}
