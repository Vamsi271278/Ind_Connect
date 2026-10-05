import {
  Global,
  Inject,
  Logger,
  Module,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

import type { AppConfig } from '../../config/app-config.js';
import { APP_CONFIG } from '../../config/config.module.js';
import { EPHEMERAL_STORE } from './ephemeral-store.js';
import { RedisEphemeralStore } from './redis-ephemeral-store.js';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): RedisClientType =>
        createClient({
          url: config.redis.url.reveal(),
          // Fail fast instead of queueing commands while disconnected: OTP and
          // rate-limit paths must fail closed, never wait or silently pass.
          disableOfflineQueue: true,
          socket: {
            connectTimeout: 2000,
            reconnectStrategy: (retries: number) => Math.min(250 * (retries + 1), 5000),
          },
        }),
    },
    {
      provide: EPHEMERAL_STORE,
      inject: [REDIS_CLIENT],
      useFactory: (client: RedisClientType) => new RedisEphemeralStore(client),
    },
  ],
  exports: [EPHEMERAL_STORE],
})
export class RedisModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Redis');

  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClientType) {}

  onModuleInit(): void {
    // Never log the error message: it can contain the connection URL.
    this.client.on('error', (error: unknown) => {
      this.logger.warn({
        event: 'redis.error',
        errorName: error instanceof Error ? error.name : typeof error,
      });
    });
    // Connect in the background: the API can serve liveness while Redis is
    // down; Redis-dependent operations fail closed until it is ready.
    this.client.connect().catch(() => {
      this.logger.warn({ event: 'redis.connect_failed' });
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.close();
    } else {
      this.client.destroy();
    }
  }
}
