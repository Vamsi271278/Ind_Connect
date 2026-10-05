import type { z } from 'zod';

import { ApplicationError } from '../errors/application-error.js';

/**
 * Parses untrusted input with a strict contract schema. Failures become
 * VALIDATION_FAILED with issue locations only — never the rejected values.
 */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw new ApplicationError('VALIDATION_FAILED', {
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      code: issue.code,
    })),
  });
}

/**
 * Validates an outgoing DTO against its contract before it is sent, so a
 * response can never carry fields the contract does not declare.
 */
export function shapeResponse<T extends z.ZodType>(schema: T, value: z.input<T>): z.output<T> {
  return schema.parse(value);
}
