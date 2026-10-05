import type { ErrorCode, ErrorDetails } from '@project-connect/api-contracts';

/**
 * An expected, client-safe failure carrying a stable error code. The HTTP layer
 * maps codes to status and message; nothing internal is exposed.
 */
export class ApplicationError extends Error {
  override readonly name = 'ApplicationError';

  constructor(
    readonly code: ErrorCode,
    readonly details?: ErrorDetails,
  ) {
    super(code);
  }
}

/** Raised when ephemeral infrastructure (Redis) cannot be reached. Fails closed. */
export class EphemeralStoreUnavailableError extends Error {
  override readonly name = 'EphemeralStoreUnavailableError';
}
