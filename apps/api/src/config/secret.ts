import { inspect } from 'node:util';

const REDACTED = '[REDACTED]';

/**
 * Wraps a secret value so it cannot leak through logging, JSON serialization,
 * string interpolation or `util.inspect`. Call `reveal()` only at the point of
 * use.
 */
export class Secret {
  readonly #value: string;

  constructor(value: string) {
    this.#value = value;
  }

  reveal(): string {
    return this.#value;
  }

  toString(): string {
    return REDACTED;
  }

  toJSON(): string {
    return REDACTED;
  }

  [inspect.custom](): string {
    return REDACTED;
  }
}
