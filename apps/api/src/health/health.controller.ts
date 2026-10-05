import { Controller, Get, Header } from '@nestjs/common';

import { RawResponse } from '../shared/http/data-envelope.interceptor.js';

export interface HealthResponse {
  readonly status: 'ok';
  readonly service: 'api';
}

/**
 * Liveness only: reports that the API process is serving HTTP. It deliberately
 * exposes no environment, dependency, host or build details. Lives outside the
 * reserved /api/v1 and /admin/v1 prefixes.
 */
@Controller('health')
@RawResponse()
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  getHealth(): HealthResponse {
    return { status: 'ok', service: 'api' };
  }
}
