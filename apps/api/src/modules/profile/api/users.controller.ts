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

const toDto = (view: SelfUserView): SelfUser => shapeResponse(selfUserSchema, view);

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
