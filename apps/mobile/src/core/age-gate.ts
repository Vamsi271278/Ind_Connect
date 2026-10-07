import { daysInMonth } from '@project-connect/api-contracts';

/**
 * A03 client-side age gate (UX only). Mirrors the server's BR-AUTH-001 rule
 * (identity/domain/age.ts): "today" is the calendar date at UTC−12, so the
 * client never admits someone the server would reject. The SERVER decides
 * eligibility at registration; this only avoids a pointless round trip.
 */
export type DateOfBirthCheck =
  | { readonly kind: 'incomplete' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'future' }
  | { readonly kind: 'underage' }
  | { readonly kind: 'eligible'; readonly isoDate: string };

export interface DateOfBirthInput {
  readonly month: string;
  readonly day: string;
  readonly year: string;
}

const MINIMUM_AGE_YEARS = 18;
const EARLIEST_YEAR = 1900;
const UTC_MINUS_12_MS = 12 * 60 * 60 * 1000;

interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const compare = (a: CalendarDate, b: CalendarDate): number =>
  a.year - b.year || a.month - b.month || a.day - b.day;

const pad = (value: number, width: number) => String(value).padStart(width, '0');

function referenceDate(now: Date): CalendarDate {
  const shifted = new Date(now.getTime() - UTC_MINUS_12_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function checkDateOfBirth(input: DateOfBirthInput, now: Date): DateOfBirthCheck {
  const { month: m, day: d, year: y } = input;
  if (m === '' || d === '' || y.length < 4) return { kind: 'incomplete' };
  if (!/^\d{1,2}$/.test(m) || !/^\d{1,2}$/.test(d) || !/^\d{4}$/.test(y))
    return { kind: 'invalid' };

  const date = { year: Number(y), month: Number(m), day: Number(d) };
  if (date.month < 1 || date.month > 12) return { kind: 'invalid' };
  if (date.day < 1 || date.day > daysInMonth(date.year, date.month)) return { kind: 'invalid' };
  if (date.year < EARLIEST_YEAR) return { kind: 'invalid' };

  const today = referenceDate(now);
  if (compare(date, today) > 0) return { kind: 'future' };

  const cutoffYear = today.year - MINIMUM_AGE_YEARS;
  const cutoff = {
    year: cutoffYear,
    month: today.month,
    day: Math.min(today.day, daysInMonth(cutoffYear, today.month)),
  };
  if (compare(date, cutoff) > 0) return { kind: 'underage' };

  return {
    kind: 'eligible',
    isoDate: `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`,
  };
}
