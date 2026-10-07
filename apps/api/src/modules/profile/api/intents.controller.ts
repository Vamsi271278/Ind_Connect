import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';
import {
  type IntentOptionsResponse,
  intentOptionsResponseSchema,
  type MyIntentsResponse,
  myIntentsResponseSchema,
  updateMyIntentsBodySchema,
} from '@project-connect/api-contracts';

import { parseInput, shapeResponse } from '../../../shared/http/parse.js';
import { AccessTokenGuard, CurrentAuth } from '../../identity/api/auth.guard.js';
import type { AuthContext } from '../../identity/application/session.service.js';
import type { IntentService } from '../application/intent.service.js';
import { INTENT_SERVICE } from './tokens.js';

/** `/api/v1/profile/intents`: O04 choices (DATING only while the kill switch is on). */
@Controller('profile/intents')
@UseGuards(AccessTokenGuard)
export class IntentOptionsController {
  constructor(@Inject(INTENT_SERVICE) private readonly intents: IntentService) {}

  @Get()
  async listOptions(): Promise<IntentOptionsResponse> {
    const view = await this.intents.listOptions();
    return shapeResponse(intentOptionsResponseSchema, {
      options: view.options.map((o) => ({
        code: o.code,
        label: o.label,
        description: o.description,
      })),
      dating: view.dating,
    });
  }
}

/**
 * `/api/v1/users/me/intents`. Self only. Replaces the active non-dating
 * intents; DATING is rejected by the contract (it changes only with consent).
 */
@Controller('users/me/intents')
@UseGuards(AccessTokenGuard)
export class MyIntentsController {
  constructor(@Inject(INTENT_SERVICE) private readonly intents: IntentService) {}

  @Put()
  async updateMyIntents(
    @CurrentAuth() auth: AuthContext,
    @Body() body: unknown,
  ): Promise<MyIntentsResponse> {
    const { intents } = parseInput(updateMyIntentsBodySchema, body);
    const view = await this.intents.updateMyIntents(auth.userId, intents);
    return shapeResponse(myIntentsResponseSchema, {
      activeIntents: [...view.activeIntents],
      onboarding: view.onboarding,
    });
  }
}
