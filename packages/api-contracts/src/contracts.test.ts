import { describe, expect, it } from 'vitest';

import {
  isCalendarDate,
  otpRequestBodySchema,
  otpVerifyBodySchema,
  registrationBodySchema,
} from './index.js';

const device = {
  platform: 'ios',
  appVersion: '1.0.0',
  osVersion: '18.2',
  installId: '7d3f8a2e-1c4b-4e5a-9b6c-2f1e3d4c5b6a',
} as const;

describe('isCalendarDate', () => {
  it('accepts real dates including leap days', () => {
    expect(isCalendarDate('2000-02-29')).toBe(true);
    expect(isCalendarDate('1999-12-31')).toBe(true);
  });

  it('rejects impossible dates and other formats', () => {
    for (const value of [
      '2001-02-29',
      '1900-02-29',
      '2020-13-01',
      '2020-04-31',
      '2020-00-10',
      '20-01-01',
      '2020/01/01',
      '2020-1-1',
    ]) {
      expect(isCalendarDate(value)).toBe(false);
    }
  });
});

describe('request schemas are strict', () => {
  it('rejects unknown and protected fields (mass assignment)', () => {
    expect(
      otpRequestBodySchema.safeParse({
        phone: '+12145550123',
        installId: device.installId,
        isAdmin: true,
      }).success,
    ).toBe(false);
    expect(
      registrationBodySchema.safeParse({
        registrationToken: 'a'.repeat(43),
        dateOfBirth: '1990-05-01',
        device,
        accountStatus: 'ACTIVE',
      }).success,
    ).toBe(false);
    expect(
      otpVerifyBodySchema.safeParse({
        phone: '+12145550123',
        code: '123456',
        device: { ...device, model: 'x' },
      }).success,
    ).toBe(false);
  });

  it('requires a six-digit numeric code and a well-formed registration token', () => {
    expect(
      otpVerifyBodySchema.safeParse({ phone: '+12145550123', code: '12345', device }).success,
    ).toBe(false);
    expect(
      otpVerifyBodySchema.safeParse({ phone: '+12145550123', code: '12a456', device }).success,
    ).toBe(false);
    expect(
      registrationBodySchema.safeParse({
        registrationToken: 'short',
        dateOfBirth: '1990-05-01',
        device,
      }).success,
    ).toBe(false);
  });
});
