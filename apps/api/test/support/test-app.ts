import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/bootstrap/configure-app.js';
import { JsonLogger } from '../../src/shared/observability/json-logger.js';

/**
 * Boots the real AppModule with the production HTTP configuration and captures
 * every structured log line for leak assertions.
 */
export async function createTestApp(): Promise<{
  app: NestExpressApplication;
  logs: string[];
  close: () => Promise<void>;
}> {
  const logs: string[] = [];
  const previousSink = JsonLogger.sink;
  JsonLogger.sink = (line) => logs.push(line);

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = configureApp(
    moduleRef.createNestApplication<NestExpressApplication>({
      bodyParser: false,
      logger: new JsonLogger(),
    }),
  );
  await app.init();

  return {
    app,
    logs,
    close: async () => {
      await app.close();
      JsonLogger.sink = previousSink;
    },
  };
}
