import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { ConfigModule } from './config/config.module.js';
import { HealthModule } from './health/health.module.js';
import { ConfigurationModule } from './modules/configuration/configuration.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { LocationModule } from './modules/location/location.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { AnalyticsModule } from './shared/analytics/analytics.module.js';
import { DatabaseModule } from './shared/database/database.module.js';
import { ApiExceptionFilter } from './shared/http/api-exception.filter.js';
import { correlationMiddleware } from './shared/http/correlation.middleware.js';
import { DataEnvelopeInterceptor } from './shared/http/data-envelope.interceptor.js';
import { RedisModule } from './shared/redis/redis.module.js';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    AnalyticsModule,
    HealthModule,
    IdentityModule,
    ProfileModule,
    LocationModule,
    ConfigurationModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: DataEnvelopeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(correlationMiddleware).forRoutes('*');
  }
}
