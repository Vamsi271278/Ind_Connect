import type { ErrorCode } from '@project-connect/api-contracts';

import { ApplicationError } from '../../../shared/errors/application-error.js';
import type {
  IdempotencyRecords,
  OperationOutcome,
  RecordHandle,
} from './ephemeral/idempotency-records.js';

/**
 * Deterministic business rejections. Recorded against the operation key so a
 * replay returns the same answer without re-executing (and without, e.g.,
 * spending another OTP attempt). Anything else is transient: the record is
 * released and a retry executes again.
 */
const TERMINAL_CODES: ReadonlySet<ErrorCode> = new Set([
  'VALIDATION_FAILED',
  'OTP_INCORRECT',
  'OTP_EXPIRED',
  'OTP_ATTEMPTS_EXCEEDED',
  'ACCOUNT_NOT_ACTIVE',
  'REGISTRATION_TOKEN_INVALID',
  'AGE_NOT_ELIGIBLE',
  'PHONE_ALREADY_REGISTERED',
]);

export interface IdempotentOperation<T> {
  execute(): Promise<{ readonly value: T; readonly outcome: OperationOutcome }>;
  /** Rebuilds a response for a completed operation. May replace credentials. */
  replay(outcome: Exclude<OperationOutcome, { type: 'error' }>, handle: RecordHandle): Promise<T>;
}

export async function runIdempotent<T>(
  records: IdempotencyRecords,
  scope: string,
  idempotencyKey: string,
  fingerprint: string,
  operation: IdempotentOperation<T>,
): Promise<T> {
  const begun = await records.begin(scope, idempotencyKey, fingerprint);
  switch (begun.kind) {
    case 'key_reused':
      throw new ApplicationError('IDEMPOTENCY_KEY_REUSED');
    case 'in_progress':
      throw new ApplicationError('REQUEST_IN_PROGRESS');
    case 'replay':
      if (begun.outcome.type === 'error') throw new ApplicationError(begun.outcome.code);
      return operation.replay(begun.outcome, begun.handle);
    case 'started':
      break;
  }

  try {
    const { value, outcome } = await operation.execute();
    // If recording fails the response is still correct; a later retry simply
    // re-executes and is rejected by single-use state (code/token consumed).
    await records.complete(begun.handle, outcome).catch(() => undefined);
    return value;
  } catch (error) {
    if (error instanceof ApplicationError && TERMINAL_CODES.has(error.code)) {
      await records
        .complete(begun.handle, { type: 'error', code: error.code })
        .catch(() => undefined);
    } else {
      await records.abandon(begun.handle).catch(() => undefined);
    }
    throw error;
  }
}
