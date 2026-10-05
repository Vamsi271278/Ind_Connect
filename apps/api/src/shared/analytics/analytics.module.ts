import { Global, Logger, Module } from '@nestjs/common';

import type { AppConfig } from '../../config/app-config.js';
import { APP_CONFIG } from '../../config/config.module.js';
import { KeyedHasher } from '../crypto/crypto.js';
import { ANALYTICS, AnalyticsTracker, NoopAnalyticsProvider } from './analytics.js';

/** Analytics with the no-op provider until PostHog is approved (P10). */
@Global()
@Module({
  providers: [
    {
      provide: ANALYTICS,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) =>
        new AnalyticsTracker(
          new NoopAnalyticsProvider(),
          new KeyedHasher(config.phone.hashPepper),
          new Logger('Analytics'),
        ),
    },
  ],
  exports: [ANALYTICS],
})
export class AnalyticsModule {}
