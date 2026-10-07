import type {
  AccountStateView,
  SelfAccountQuery,
} from '../../identity/application/self-account.query.js';
import type { SessionService } from '../../identity/application/session.service.js';

export interface BootstrapSettings {
  readonly maintenanceMode: boolean;
  readonly minimumSupportedVersion: string;
  readonly featureFlags: Readonly<Record<string, boolean>>;
}

export interface BootstrapView extends BootstrapSettings {
  readonly account: AccountStateView | null;
}

export interface BootstrapLogger {
  warn(event: Record<string, unknown>): void;
}

/**
 * ADR-076 public bootstrap. Always answers, so maintenance and update gating
 * work even when authentication is broken: a missing, invalid, expired or
 * revoked token — or an unreachable identity store — yields `account: null`,
 * never an error. Clients must not treat `account: null` alone as logout.
 */
export class BootstrapService {
  constructor(
    private readonly settings: BootstrapSettings,
    private readonly sessions: SessionService,
    private readonly selfAccount: SelfAccountQuery,
    private readonly logger: BootstrapLogger,
  ) {}

  async getBootstrap(accessToken: string | undefined): Promise<BootstrapView> {
    return { ...this.settings, account: await this.resolveAccount(accessToken) };
  }

  private async resolveAccount(accessToken: string | undefined): Promise<AccountStateView | null> {
    if (accessToken === undefined) return null;
    try {
      // Any status: restricted accounts still need their status for routing.
      const auth = await this.sessions.authenticate(accessToken, 'any');
      return (await this.selfAccount.getAccountState(auth.userId)) ?? null;
    } catch (error) {
      if (!(error instanceof Error && error.name === 'ApplicationError')) {
        this.logger.warn({ event: 'bootstrap.account_unavailable' });
      }
      return null;
    }
  }
}
