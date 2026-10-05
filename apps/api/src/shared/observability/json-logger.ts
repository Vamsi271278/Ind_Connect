import type { LoggerService } from '@nestjs/common';

import { currentCorrelationId } from './request-context.js';

type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';

// Keys whose values are never written, at any depth (ADR-036, security rules).
// `phoneHash` / `ipHash` (HMAC identifiers) stay loggable; raw values do not.
const SENSITIVE_KEY =
  /token|secret|password|pepper|authorization|cookie|^otp|^code$|^phone$|^phonee164$|e164|^ip$|dob|dateofbirth|birth|privatekey|fakecode/i;
// Defense in depth for values that slipped into free text.
const E164_LIKE = /\+\d{7,15}/g;
const JWT_LIKE = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const REDACTED = '[REDACTED]';

function scrubString(value: string): string {
  return value.replace(JWT_LIKE, REDACTED).replace(E164_LIKE, REDACTED);
}

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[TRUNCATED]';
  if (typeof value === 'string') return scrubString(value);
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * Logs an error without its message: driver and ORM messages can embed query
 * parameters (phone numbers, tokens). Keeps the type, driver code, constraint
 * and stack frames only.
 */
export function describeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { errorType: typeof error };
  const cause: unknown = error.cause;
  const driver = typeof cause === 'object' && cause !== null ? cause : error;
  const pick = (key: string): unknown =>
    key in driver ? (driver as Record<string, unknown>)[key] : undefined;
  return {
    errorName: error.name,
    driverCode: pick('code'),
    constraint: pick('constraint'),
    frames: (error.stack ?? '')
      .split('\n')
      .filter((line) => line.trimStart().startsWith('at '))
      .slice(0, 8)
      .map((line) => line.trim()),
  };
}

export type LogSink = (line: string) => void;

/**
 * Structured JSON logger (ADR-036). Every line carries the request correlation
 * ID when one exists and passes through redaction.
 */
export class JsonLogger implements LoggerService {
  static sink: LogSink = (line) => {
    process.stdout.write(`${line}\n`);
  };

  constructor(private readonly service = 'api') {}

  private write(level: Level, message: unknown, context?: unknown): void {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      correlationId: currentCorrelationId(),
    };
    if (typeof context === 'string') entry.context = context;
    if (typeof message === 'object' && message !== null && !(message instanceof Error)) {
      Object.assign(entry, redact(message));
    } else if (message instanceof Error) {
      Object.assign(entry, describeError(message));
    } else {
      entry.message = redact(String(message));
    }
    JsonLogger.sink(JSON.stringify(entry));
  }

  log(message: unknown, context?: unknown): void {
    this.write('info', message, context);
  }

  error(message: unknown, ...rest: unknown[]): void {
    this.write('error', message, rest.at(-1));
  }

  warn(message: unknown, context?: unknown): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: unknown): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: unknown): void {
    this.write('verbose', message, context);
  }

  fatal(message: unknown, context?: unknown): void {
    this.write('fatal', message, context);
  }
}
