import { describe, expect, it } from 'vitest';

import { maskPhone, normalizePhone } from './phone.js';

describe('normalizePhone', () => {
  it('normalizes formatted international numbers to E.164', () => {
    expect(normalizePhone('+1 (214) 555-0123')).toEqual({ e164: '+12145550123', country: 'US' });
    expect(normalizePhone('  +91 98765 43210 ')).toEqual({ e164: '+919876543210', country: 'IN' });
    expect(normalizePhone('+44 7400 123456')).toEqual({ e164: '+447400123456', country: 'GB' });
  });

  it('rejects numbers without an international prefix', () => {
    expect(normalizePhone('2145550123')).toBeUndefined();
    expect(normalizePhone('(214) 555-0123')).toBeUndefined();
  });

  it('rejects malformed, impossible and oversized input', () => {
    for (const input of [
      '',
      '+',
      '+1',
      '+1 214',
      '+1 abc def ghij',
      '+0123456789',
      `+1${'2'.repeat(40)}`,
    ]) {
      expect(normalizePhone(input)).toBeUndefined();
    }
  });
});

describe('maskPhone', () => {
  it('reveals only the calling code and last four digits', () => {
    expect(maskPhone('+12145550123')).toBe('+1 ••• ••• 0123');
    expect(maskPhone('+919876543210')).toBe('+91 ••• ••• 3210');
  });
});
