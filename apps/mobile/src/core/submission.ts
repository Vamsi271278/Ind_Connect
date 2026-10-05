import { isTransient } from './api-error';

/**
 * One user submission (e.g. tapping "Verify") = one Idempotency-Key. Network
 * retries of the same submission reuse the key so the server can replay the
 * original outcome; a new user submission creates a new Submission (new key).
 */
export interface Submission {
  readonly idempotencyKey: string;
  /** Runs the operation, retrying transient failures with the SAME key. */
  run<T>(operation: (idempotencyKey: string) => Promise<T>): Promise<T>;
}

export function createSubmission(
  generateKey: () => string,
  options: { readonly maxAttempts?: number; readonly delayMs?: (attempt: number) => number } = {},
): Submission {
  const idempotencyKey = generateKey();
  const maxAttempts = options.maxAttempts ?? 3;
  const delayMs = options.delayMs ?? ((attempt: number) => 300 * 2 ** attempt);

  return {
    idempotencyKey,
    async run<T>(operation: (key: string) => Promise<T>): Promise<T> {
      for (let attempt = 0; ; attempt += 1) {
        try {
          return await operation(idempotencyKey);
        } catch (error) {
          if (!isTransient(error) || attempt + 1 >= maxAttempts) throw error;
          await new Promise((resolve) => setTimeout(resolve, delayMs(attempt)));
        }
      }
    },
  };
}
