import { normalizePhone } from '@project-connect/api-contracts';

import type { CountryPolicy } from '../../../config/app-config.js';
import { ApplicationError } from '../../../shared/errors/application-error.js';

export interface ResolvedPhone {
  readonly e164: string;
  readonly country: string | undefined;
}

/**
 * Normalizes client phone input and applies the configured country policy.
 * The policy is configuration-driven; no country list lives in code.
 */
export function resolvePhone(input: string, policy: CountryPolicy): ResolvedPhone {
  const phone = normalizePhone(input);
  if (phone === undefined) throw new ApplicationError('PHONE_INVALID');
  if (
    policy.mode === 'allowlist' &&
    (phone.country === undefined || !policy.countries.has(phone.country))
  ) {
    throw new ApplicationError('PHONE_COUNTRY_NOT_SUPPORTED');
  }
  return phone;
}

/** Bounds a provider call (ADR-072). Rejects with `ProviderTimeoutError`. */
export class ProviderTimeoutError extends Error {
  override readonly name = 'ProviderTimeoutError';
}

export async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new ProviderTimeoutError());
    }, timeoutMs);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
