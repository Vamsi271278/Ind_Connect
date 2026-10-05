import type { NestExpressApplication } from '@nestjs/platform-express';

import type { AppConfig } from '../config/app-config.js';
import { APP_CONFIG } from '../config/config.module.js';

/** Consumer API namespace (GR-007). `/health` stays outside it. */
export const CONSUMER_API_PREFIX = 'api/v1';

/**
 * HTTP configuration shared by main.ts and the e2e tests, so tests exercise the
 * same application surface that runs in production.
 */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  const config = app.get<AppConfig>(APP_CONFIG);
  // Do not advertise the HTTP framework (X-Powered-By: Express).
  app.disable('x-powered-by');
  // Only trust X-Forwarded-For from the configured number of proxy hops;
  // otherwise clients could spoof the IP used for rate limiting.
  app.set('trust proxy', config.trustProxy);
  app.useBodyParser('json', { limit: '16kb' });
  app.setGlobalPrefix(CONSUMER_API_PREFIX, { exclude: ['health'] });
  return app;
}
