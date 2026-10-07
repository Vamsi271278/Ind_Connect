import type { ErrorCode } from '@project-connect/api-contracts';

/** The API answered with the stable error envelope. */
export class ApiResponseError extends Error {
  override readonly name = 'ApiResponseError';

  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    readonly retryAfterSeconds: number | undefined,
  ) {
    super(code);
  }
}

/** No usable response: offline, DNS, timeout, or an unparseable body. */
export class NetworkError extends Error {
  override readonly name = 'NetworkError';
}

/** The session is over (refresh rejected or no credential). Re-authentication required. */
export class SessionEndedError extends Error {
  override readonly name = 'SessionEndedError';
}

const TRANSIENT_CODES: ReadonlySet<ErrorCode> = new Set([
  'SERVICE_UNAVAILABLE',
  'OTP_UNAVAILABLE',
  'INTERNAL_ERROR',
  'RATE_LIMITED',
]);

/**
 * Transient: worth retrying later and must never destroy stored credentials —
 * network failures, 5xx and throttling.
 */
export function isTransient(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof ApiResponseError) {
    return error.status >= 500 || TRANSIENT_CODES.has(error.code);
  }
  return false;
}
