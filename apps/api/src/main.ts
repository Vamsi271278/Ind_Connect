import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap/configure-app.js';
import type { AppConfig } from './config/app-config.js';
import { APP_CONFIG } from './config/config.module.js';
import { JsonLogger } from './shared/observability/json-logger.js';

async function bootstrap() {
  const app = configureApp(
    await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: new JsonLogger(),
      bodyParser: false,
    }),
  );
  app.enableShutdownHooks();
  await app.listen(app.get<AppConfig>(APP_CONFIG).port);
}
await bootstrap();
