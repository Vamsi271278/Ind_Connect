import { INTERESTS_MIN, LANGUAGES_MIN, type Language } from '@project-connect/api-contracts';

/** Case- and accent-insensitive comparison form. */
const fold = (value: string): string =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/** O06 local search: prefix match on the language name. Never a server call. */
export function filterLanguages(
  languages: readonly Language[],
  query: string,
): readonly Language[] {
  const q = fold(query);
  return q === '' ? languages : languages.filter((l) => fold(l.displayName).startsWith(q));
}

export function toggle(selection: ReadonlySet<string>, code: string): ReadonlySet<string> {
  const next = new Set(selection);
  if (next.has(code)) next.delete(code);
  else next.add(code);
  return next;
}

export const canSaveLanguages = (selection: ReadonlySet<string>): boolean =>
  selection.size >= LANGUAGES_MIN;

export const canSaveInterests = (selection: ReadonlySet<string>): boolean =>
  selection.size >= INTERESTS_MIN;

/** Spoken form of the counter (no "·" for screen readers to stumble on). */
export function interestCounterSpoken(count: number): string {
  const missing = INTERESTS_MIN - count;
  return missing > 0
    ? `${String(count)} selected, choose ${String(missing)} more`
    : `${String(count)} selected`;
}

/** "3 selected" — with what is still needed while below the minimum. */
export function interestCounterText(count: number): string {
  const missing = INTERESTS_MIN - count;
  return missing > 0
    ? `${String(count)} selected · choose ${String(missing)} more`
    : `${String(count)} selected`;
}
