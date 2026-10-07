import { Controller, Get, Headers, Inject } from '@nestjs/common';
import { type BootstrapResponse, bootstrapResponseSchema } from '@project-connect/api-contracts';

import { shapeResponse } from '../../../shared/http/parse.js';
import type { BootstrapService } from '../application/bootstrap.service.js';
import { BOOTSTRAP_SERVICE } from './tokens.js';

const BEARER = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/;

/** `GET /api/v1/app/bootstrap` — public; account only with a valid access token. */
@Controller('app')
export class BootstrapController {
  constructor(@Inject(BOOTSTRAP_SERVICE) private readonly bootstrap: BootstrapService) {}

  @Get('bootstrap')
  async getBootstrap(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<BootstrapResponse> {
    const token = BEARER.exec(authorization ?? '')?.[1];
    return shapeResponse(bootstrapResponseSchema, await this.bootstrap.getBootstrap(token));
  }
}
