import type { NestExpressApplication } from '@nestjs/platform-express';

/**
 * HTTP configuration shared by main.ts and the e2e tests, so tests exercise the
 * same application surface that runs in production.
 */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  // Do not advertise the HTTP framework (X-Powered-By: Express).
  app.disable('x-powered-by');
  return app;
}
