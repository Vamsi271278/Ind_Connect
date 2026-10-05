import { describe, expect, it } from 'vitest';

import { checkDateOfBirth } from './age-gate';

// 2026-10-05 12:00 UTC → reference date (UTC−12) is 2026-10-05.
const NOON = new Date('2026-10-05T12:00:00Z');
// 2026-10-05 06:00 UTC → still 2026-10-04 at UTC−12.
const EARLY = new Date('2026-10-05T06:00:00Z');

const dob = (month: string, day: string, year: string) => ({ month, day, year });

describe('checkDateOfBirth (A03, mirrors server BR-AUTH-001)', () => {
  it('waits for a complete date', () => {
    expect(checkDateOfBirth(dob('', '14', '1994'), NOON).kind).toBe('incomplete');
    expect(checkDateOfBirth(dob('08', '14', '199'), NOON).kind).toBe('incomplete');
  });

  it('rejects impossible and implausible dates', () => {
    expect(checkDateOfBirth(dob('13', '01', '1994'), NOON).kind).toBe('invalid');
    expect(checkDateOfBirth(dob('02', '30', '1994'), NOON).kind).toBe('invalid');
    expect(checkDateOfBirth(dob('02', '29', '2001'), NOON).kind).toBe('invalid');
    expect(checkDateOfBirth(dob('1a', '01', '1994'), NOON).kind).toBe('invalid');
    expect(checkDateOfBirth(dob('01', '01', '1899'), NOON).kind).toBe('invalid');
  });

  it('rejects future dates', () => {
    expect(checkDateOfBirth(dob('10', '06', '2026'), NOON).kind).toBe('future');
  });

  it('is eligible on the 18th birthday at the UTC−12 reference date, not before', () => {
    expect(checkDateOfBirth(dob('10', '05', '2008'), NOON)).toEqual({
      kind: 'eligible',
      isoDate: '2008-10-05',
    });
    expect(checkDateOfBirth(dob('10', '06', '2008'), NOON).kind).toBe('underage');
    // Same birthday, but it is still Oct 4 at UTC−12: not yet 18.
    expect(checkDateOfBirth(dob('10', '05', '2008'), EARLY).kind).toBe('underage');
  });

  it('treats Feb 29 births like the server (eligible on Mar 1 in common years)', () => {
    const mar1 = new Date('2026-03-01T12:00:00Z');
    const feb28 = new Date('2026-02-28T12:00:00Z');
    expect(checkDateOfBirth(dob('02', '29', '2008'), feb28).kind).toBe('underage');
    expect(checkDateOfBirth(dob('02', '29', '2008'), mar1).kind).toBe('eligible');
  });

  it('normalises single-digit month and day to an ISO date', () => {
    expect(checkDateOfBirth(dob('8', '4', '1994'), NOON)).toEqual({
      kind: 'eligible',
      isoDate: '1994-08-04',
    });
  });
});
