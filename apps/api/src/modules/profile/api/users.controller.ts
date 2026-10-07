import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import {
  type SelfUser,
  selfUserSchema,
  updateProfileBodySchema,
} from '@project-connect/api-contracts';

import { parseInput, shapeResponse } from '../../../shared/http/parse.js';
import { AccessTokenGuard, CurrentAuth } from '../../identity/api/auth.guard.js';
import type { AuthContext } from '../../identity/application/session.service.js';
import type { ProfileService, SelfUserView } from '../application/profile.service.js';
import { PROFILE_SERVICE } from './tokens.js';

/**
 * Explicit self projection. The city is mapped field by field (city/metro
 * context only); dating is a single boolean, never consent details.
 */
const toDto = (view: SelfUserView): SelfUser =>
  shapeResponse(selfUserSchema, {
    id: view.id,
    accountStatus: view.accountStatus,
    onboarding: view.onboarding,
    profile: view.profile,
    phoneMasked: view.phoneMasked,
    age: view.age,
    location:
      view.location === null
        ? null
        : {
            city: {
              id: view.location.city.id,
              name: view.location.city.name,
              stateRegion: view.location.city.stateRegion,
              countryCode: view.location.city.countryCode,
              metro: {
                id: view.location.city.metro.id,
                code: view.location.city.metro.code,
                name: view.location.city.metro.name,
              },
              launchStatus: view.location.city.launchStatus,
            },
          },
    activeIntents: [...view.activeIntents],
    datingEnabled: view.datingEnabled,
    languages: view.languages.map((l) => ({ code: l.code, displayName: l.displayName })),
    interests: view.interests.map((i) => ({
      code: i.code,
      label: i.label,
      categoryCode: i.categoryCode,
    })),
  });

/**
 * `/api/v1/users/me*`. Self only: identity comes from the server session,
 * never from the request (AUTHORIZATION §PART XXIV). ACTIVE and
 * PENDING_VERIFICATION accounts only (guard default).
 */
@Controller('users/me')
@UseGuards(AccessTokenGuard)
export class UsersController {
  constructor(@Inject(PROFILE_SERVICE) private readonly profiles: ProfileService) {}

  @Get()
  async getMe(@CurrentAuth() auth: AuthContext): Promise<SelfUser> {
    return toDto(await this.profiles.getMe(auth.userId));
  }

  @Patch('profile')
  async updateProfile(@CurrentAuth() auth: AuthContext, @Body() body: unknown): Promise<SelfUser> {
    const patch = parseInput(updateProfileBodySchema, body);
    return toDto(await this.profiles.updateMyProfile(auth.userId, patch));
  }
}
