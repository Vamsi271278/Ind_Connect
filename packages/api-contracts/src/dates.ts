import { z } from 'zod';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const daysInMonth = (year: number, month: number): number =>
  month === 2 ? (isLeapYear(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;

/** True when `value` is `YYYY-MM-DD` and names a real calendar date. */
export function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/**
 * A calendar date (`YYYY-MM-DD`). Format and calendar validity only: age
 * eligibility is decided by the server, never by this contract.
 */
export const calendarDateSchema = z.string().refine(isCalendarDate, { message: 'invalid_date' });
