/** Age eligibility (BR-AUTH-001). Pure: no clock, framework or I/O access. */

export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export const MINIMUM_AGE_YEARS = 18;
const EARLIEST_BIRTH_DATE: CalendarDate = { year: 1900, month: 1, day: 1 };
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
// UTC-12 is the last place on Earth where a calendar date begins. Using it as
// "today" means nobody becomes eligible before their 18th birthday wherever
// they are. Mirrors the users_minimum_age_at_creation_ck database constraint.
const UTC_MINUS_12_MS = 12 * 60 * 60 * 1000;

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (year: number, month: number): number =>
  month === 2 ? (isLeapYear(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;

const compare = (a: CalendarDate, b: CalendarDate): number =>
  a.year - b.year || a.month - b.month || a.day - b.day;

export function parseCalendarDate(value: string): CalendarDate | undefined {
  const match = ISO_DATE.exec(value);
  if (!match) return undefined;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  if (date.month < 1 || date.month > 12) return undefined;
  if (date.day < 1 || date.day > daysInMonth(date.year, date.month)) return undefined;
  return date;
}

/** The calendar date at UTC-12 for the given instant. */
export function eligibilityReferenceDate(now: Date): CalendarDate {
  const shifted = new Date(now.getTime() - UTC_MINUS_12_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/**
 * The latest birth date that is at least `years` old on `reference`. A
 * reference of Feb 29 maps to Feb 28 in a common year, so a Feb 29 birth
 * qualifies on Mar 1 of a common year — the same result as PostgreSQL's
 * `date - interval 'N years'`.
 */
function latestEligibleBirthDate(reference: CalendarDate, years: number): CalendarDate {
  const year = reference.year - years;
  return {
    year,
    month: reference.month,
    day: Math.min(reference.day, daysInMonth(year, reference.month)),
  };
}

export type AgeAssessment = 'eligible' | 'underage' | 'implausible';

/**
 * `implausible`: a future date or one before 1900 (input error, not an age
 * decision). `underage`: under 18 at the UTC-12 reference date.
 */
export function assessAge(dateOfBirth: CalendarDate, now: Date): AgeAssessment {
  const reference = eligibilityReferenceDate(now);
  if (compare(dateOfBirth, reference) > 0 || compare(dateOfBirth, EARLIEST_BIRTH_DATE) < 0) {
    return 'implausible';
  }
  return compare(dateOfBirth, latestEligibleBirthDate(reference, MINIMUM_AGE_YEARS)) <= 0
    ? 'eligible'
    : 'underage';
}

export const formatCalendarDate = (date: CalendarDate): string =>
  `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;

/**
 * Whole years of age at the UTC-12 reference date — the same conservative
 * boundary as eligibility, so a displayed age never runs ahead of the true age.
 */
export function ageInYears(dateOfBirth: CalendarDate, now: Date): number {
  const reference = eligibilityReferenceDate(now);
  let years = reference.year - dateOfBirth.year;
  if (
    compare(
      { year: dateOfBirth.year + years, month: dateOfBirth.month, day: dateOfBirth.day },
      reference,
    ) > 0
  ) {
    years -= 1;
  }
  return years;
}
