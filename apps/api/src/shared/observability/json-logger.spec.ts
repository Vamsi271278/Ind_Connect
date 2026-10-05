import { afterEach, describe, expect, it } from 'vitest';

import { describeError, JsonLogger, redact } from './json-logger.js';
import { requestContext } from './request-context.js';

describe('redact', () => {
  it('removes sensitive keys at any depth but keeps HMAC identifiers', () => {
    const out = redact({
      phone: '+12145550123',
      code: '123456',
      refreshToken: 'abc',
      nested: { dateOfBirth: '1990-01-01', authorization: 'Bearer x', otpCode: '1' },
      phoneHash: 'deadbeef',
      ipHash: 'cafe',
      errorCode: 'OTP_INCORRECT',
    });
    expect(out).toEqual({
      phone: '[REDACTED]',
      code: '[REDACTED]',
      refreshToken: '[REDACTED]',
      nested: { dateOfBirth: '[REDACTED]', authorization: '[REDACTED]', otpCode: '[REDACTED]' },
      phoneHash: 'deadbeef',
      ipHash: 'cafe',
      errorCode: 'OTP_INCORRECT',
    });
  });

  it('scrubs phone numbers and JWTs embedded in free text', () => {
    expect(redact('failed for +12145550123 with eyJhbGci.eyJzdWIi.c2lnbmF0')).toBe(
      'failed for [REDACTED] with [REDACTED]',
    );
  });
});

describe('describeError', () => {
  it('drops error messages, which can embed query parameters', () => {
    const driverError = Object.assign(new Error('duplicate key (phone_e164)=(+12145550123)'), {
      code: '23505',
      constraint: 'users_phone_e164_not_deleted_uq',
    });
    const wrapped = new Error('Failed query: insert ... params: +12145550123', {
      cause: driverError,
    });
    const described = describeError(wrapped);
    expect(described).toMatchObject({
      driverCode: '23505',
      constraint: 'users_phone_e164_not_deleted_uq',
    });
    expect(JSON.stringify(described)).not.toContain('2145550123');
  });
});

describe('JsonLogger', () => {
  const original = JsonLogger.sink;
  afterEach(() => {
    JsonLogger.sink = original;
  });

  it('writes structured lines with the correlation ID and redaction applied', () => {
    const lines: string[] = [];
    JsonLogger.sink = (line) => lines.push(line);
    requestContext.run({ correlationId: 'corr-12345678' }, () => {
      new JsonLogger().log(
        { event: 'otp.requested', phone: '+12145550123', phoneHash: 'h' },
        'Identity',
      );
    });
    const entry = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
    expect(entry).toMatchObject({
      level: 'info',
      correlationId: 'corr-12345678',
      context: 'Identity',
      event: 'otp.requested',
      phone: '[REDACTED]',
      phoneHash: 'h',
    });
  });
});
