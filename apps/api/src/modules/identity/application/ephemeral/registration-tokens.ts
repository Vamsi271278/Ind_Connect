import { z } from 'zod';

import type { EphemeralStore } from '../../../../shared/redis/ephemeral-store.js';

const registrationTicketSchema = z.strictObject({
  phoneE164: z.string(),
  phoneVerifiedAt: z.iso.datetime(),
});
export type RegistrationTicket = z.infer<typeof registrationTicketSchema>;

/**
 * Single-use proof that a phone number was verified, redeemable once for
 * account creation. Keyed by the SHA-256 of the token; the token itself is
 * never stored.
 */
export class RegistrationTokens {
  constructor(
    private readonly store: EphemeralStore,
    private readonly ttlMs: number,
  ) {}

  private key = (tokenHash: string) => `registration:${tokenHash}`;

  save(tokenHash: string, ticket: RegistrationTicket): Promise<void> {
    return this.store.set(this.key(tokenHash), JSON.stringify(ticket), this.ttlMs);
  }

  /** Atomically redeems the ticket. Undefined if missing, expired or used. */
  async consume(tokenHash: string): Promise<RegistrationTicket | undefined> {
    const raw = await this.store.getDelete(this.key(tokenHash));
    if (raw === undefined) return undefined;
    const parsed = registrationTicketSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  }
}
