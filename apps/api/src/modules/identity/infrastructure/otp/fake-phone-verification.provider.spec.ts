import { describe, expect, it } from 'vitest';

import { ManualClock } from '../../../../../test/support/manual-clock.js';
import { Secret } from '../../../../config/secret.js';
import { FakePhoneVerificationProvider } from './fake-phone-verification.provider.js';

const settings = { codeTtlMs: 300_000, maxAttempts: 3 };
const PHONE = '+12145550123';

describe('FakePhoneVerificationProvider', () => {
  it('cannot be constructed in production', () => {
    expect(
      () =>
        new FakePhoneVerificationProvider(
          new Secret('123456'),
          settings,
          new ManualClock('2026-01-01'),
          'production',
        ),
    ).toThrow(/production/);
  });

  it('approves only the configured code, once', async () => {
    const provider = new FakePhoneVerificationProvider(
      new Secret('123456'),
      settings,
      new ManualClock('2026-01-01'),
      'test',
    );
    await provider.start({ phoneE164: PHONE });
    expect(await provider.check({ phoneE164: PHONE, code: '654321' })).toBe('incorrect');
    expect(await provider.check({ phoneE164: PHONE, code: '123456' })).toBe('approved');
    expect(await provider.check({ phoneE164: PHONE, code: '123456' })).toBe('expired');
  });

  it('expires codes and enforces its own attempt ceiling', async () => {
    const clock = new ManualClock('2026-01-01');
    const provider = new FakePhoneVerificationProvider(
      new Secret('123456'),
      settings,
      clock,
      'test',
    );
    await provider.start({ phoneE164: PHONE });
    clock.advance(300_000);
    expect(await provider.check({ phoneE164: PHONE, code: '123456' })).toBe('expired');

    await provider.start({ phoneE164: PHONE });
    expect(await provider.check({ phoneE164: PHONE, code: '000000' })).toBe('incorrect');
    expect(await provider.check({ phoneE164: PHONE, code: '000000' })).toBe('incorrect');
    expect(await provider.check({ phoneE164: PHONE, code: '000000' })).toBe('max_attempts');
  });
});
