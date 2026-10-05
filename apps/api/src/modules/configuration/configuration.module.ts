import { Logger, Module } from '@nestjs/common';

import type { AppConfig } from '../../config/app-config.js';
import { APP_CONFIG } from '../../config/config.module.js';
import { SELF_ACCOUNT_QUERY, SESSION_SERVICE } from '../identity/api/tokens.js';
import type { SelfAccountQuery } from '../identity/application/self-account.query.js';
import type { SessionService } from '../identity/application/session.service.js';
import { IdentityModule } from '../identity/identity.module.js';
import { BootstrapController } from './api/bootstrap.controller.js';
import { BOOTSTRAP_SERVICE } from './api/tokens.js';
import { BootstrapService } from './application/bootstrap.service.js';

/** App configuration surface (ADR-076 bootstrap; ADR-032 flags from config for now). */
@Module({
  imports: [IdentityModule],
  controllers: [BootstrapController],
  providers: [
    {
      provide: BOOTSTRAP_SERVICE,
      inject: [APP_CONFIG, SESSION_SERVICE, SELF_ACCOUNT_QUERY],
      useFactory: (config: AppConfig, sessions: SessionService, selfAccount: SelfAccountQuery) =>
        new BootstrapService(config.bootstrap, sessions, selfAccount, new Logger('Bootstrap')),
    },
  ],
})
export class ConfigurationModule {}
