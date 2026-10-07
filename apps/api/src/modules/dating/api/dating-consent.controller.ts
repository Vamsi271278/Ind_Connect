import { Body, Controller, Delete, HttpCode, Inject, Put, UseGuards } from '@nestjs/common';
import {
  type DatingConsentResponse,
  datingConsentResponseSchema,
  putDatingConsentBodySchema,
} from '@project-connect/api-contracts';

import { parseInput, shapeResponse } from '../../../shared/http/parse.js';
import {
  AccessTokenGuard,
  AllowAnyAccountStatus,
  CurrentAuth,
} from '../../identity/api/auth.guard.js';
import type { AuthContext } from '../../identity/application/session.service.js';
import type { DatingConsentService } from '../application/dating-consent.service.js';
import { DATING_CONSENT_SERVICE } from './tokens.js';

/**
 * `/api/v1/users/me/dating/consent`. Self only; the consent is a resource:
 * PUT opts in (idempotent), DELETE withdraws (idempotent, never blocked).
 * Responses never carry consent history, timestamps, source or version.
 */
@Controller('users/me/dating/consent')
@UseGuards(AccessTokenGuard)
export class DatingConsentController {
  constructor(@Inject(DATING_CONSENT_SERVICE) private readonly consents: DatingConsentService) {}

  @Put()
  async optIn(
    @CurrentAuth() auth: AuthContext,
    @Body() body: unknown,
  ): Promise<DatingConsentResponse> {
    const { policyVersion } = parseInput(putDatingConsentBodySchema, body);
    await this.consents.optIn(auth.userId, policyVersion);
    return shapeResponse(datingConsentResponseSchema, { datingEnabled: true });
  }

  /** Withdrawal works for every authenticated account, whatever its status. */
  @Delete()
  @HttpCode(204)
  @AllowAnyAccountStatus()
  async optOut(@CurrentAuth() auth: AuthContext): Promise<void> {
    await this.consents.optOut(auth.userId);
  }
}
