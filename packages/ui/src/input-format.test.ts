import { describe, expect, it } from 'vitest';

import { formatNationalNumber, phoneDigits, sanitizeOtp, toInternational } from './input-format.js';

describe('sanitizeOtp', () => {
  it('keeps at most six digits from typed, pasted or autofilled input', () => {
    expect(sanitizeOtp('48')).toBe('48');
    expect(sanitizeOtp('123 456')).toBe('123456');
    expect(sanitizeOtp('Your code: 123456. Do not share')).toBe('123456');
    expect(sanitizeOtp('1234567')).toBe('123456');
    expect(sanitizeOtp('abc')).toBe('');
  });
});

describe('phone formatting', () => {
  it('formats NANP numbers progressively', () => {
    expect(formatNationalNumber('1', '214')).toBe('214');
    expect(formatNationalNumber('1', '2145')).toBe('(214) 5');
    expect(formatNationalNumber('1', '2145550123')).toBe('(214) 555-0123');
    expect(formatNationalNumber('1', '(214) 555-0123 99')).toBe('(214) 555-0123');
  });

  it('leaves other calling codes as digits', () => {
    expect(formatNationalNumber('91', '98765 43210')).toBe('9876543210');
  });

  it('builds the international form the API expects', () => {
    expect(toInternational('1', '(214) 555-0123')).toBe('+12145550123');
    expect(phoneDigits('+1 (214) 555-0123 ext')).toBe('12145550123');
  });
});
