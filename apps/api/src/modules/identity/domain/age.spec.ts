import { describe, expect, it } from 'vitest';

import { assessAge, eligibilityReferenceDate, parseCalendarDate } from './age.js';

const date = (value: string) => {
  const parsed = parseCalendarDate(value);
  if (parsed === undefined) throw new Error(`bad test date ${value}`);
  return parsed;
};

describe('parseCalendarDate', () => {
  it('accepts real dates and rejects impossible ones', () => {
    expect(parseCalendarDate('2004-02-29')).toEqual({ year: 2004, month: 2, day: 29 });
    for (const bad of [
      '2005-02-29',
      '1900-02-29',
      '2020-04-31',
      '2020-13-01',
      '2020-00-01',
      '2020-1-1',
      'x',
    ]) {
      expect(parseCalendarDate(bad)).toBeUndefined();
    }
  });
});

describe('eligibilityReferenceDate (UTC-12)', () => {
  it('is the calendar date at UTC-12, not UTC', () => {
    // 11:59 UTC on Oct 5 is still Oct 4 at UTC-12.
    expect(eligibilityReferenceDate(new Date('2026-10-05T11:59:59Z'))).toEqual({
      year: 2026,
      month: 10,
      day: 4,
    });
    expect(eligibilityReferenceDate(new Date('2026-10-05T12:00:00Z'))).toEqual({
      year: 2026,
      month: 10,
      day: 5,
    });
  });
});

describe('assessAge', () => {
  const noonUtc = (day: string) => new Date(`${day}T12:00:00Z`);

  it('is eligible exactly on the 18th birthday and not the day before', () => {
    expect(assessAge(date('2008-10-05'), noonUtc('2026-10-05'))).toBe('eligible');
    expect(assessAge(date('2008-10-06'), noonUtc('2026-10-05'))).toBe('underage');
  });

  it('does not let anyone qualify before their birthday has begun at UTC-12', () => {
    // 08:00 UTC Oct 5 = Oct 4 at UTC-12: an Oct 5 2008 birth is not yet 18.
    expect(assessAge(date('2008-10-05'), new Date('2026-10-05T08:00:00Z'))).toBe('underage');
    expect(assessAge(date('2008-10-05'), new Date('2026-10-05T12:00:00Z'))).toBe('eligible');
  });

  it('treats a Feb 29 birth as qualifying on Mar 1 in a common year', () => {
    expect(assessAge(date('2008-02-29'), noonUtc('2026-02-28'))).toBe('underage');
    expect(assessAge(date('2008-02-29'), noonUtc('2026-03-01'))).toBe('eligible');
  });

  it('handles a Feb 29 reference date', () => {
    // 2028-02-29 minus 18 years = 2010-02-28 (2010 is a common year).
    expect(assessAge(date('2010-02-28'), noonUtc('2028-02-29'))).toBe('eligible');
    expect(assessAge(date('2010-03-01'), noonUtc('2028-02-29'))).toBe('underage');
  });

  it('flags future dates and dates before 1900 as implausible', () => {
    expect(assessAge(date('2026-10-06'), noonUtc('2026-10-05'))).toBe('implausible');
    expect(assessAge(date('1899-12-31'), noonUtc('2026-10-05'))).toBe('implausible');
    expect(assessAge(date('1900-01-01'), noonUtc('2026-10-05'))).toBe('eligible');
  });

  it('treats a birth today as underage, not implausible', () => {
    expect(assessAge(date('2026-10-05'), noonUtc('2026-10-05'))).toBe('underage');
  });
});
