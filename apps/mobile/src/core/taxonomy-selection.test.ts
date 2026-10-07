import { describe, expect, it } from 'vitest';

import {
  canSaveInterests,
  canSaveLanguages,
  filterLanguages,
  interestCounterSpoken,
  interestCounterText,
  toggle,
} from './taxonomy-selection';

const LANGUAGES = [
  { code: 'en', displayName: 'English' },
  { code: 'te', displayName: 'Telugu' },
  { code: 'ta', displayName: 'Tamil' },
  { code: 'hi', displayName: 'Hindi' },
];

describe('filterLanguages', () => {
  it('returns all for an empty query and prefix-matches names case-insensitively', () => {
    expect(filterLanguages(LANGUAGES, ' ')).toHaveLength(4);
    expect(filterLanguages(LANGUAGES, 't').map((l) => l.code)).toEqual(['te', 'ta']);
    expect(filterLanguages(LANGUAGES, 'TEL').map((l) => l.code)).toEqual(['te']);
    expect(filterLanguages(LANGUAGES, 'Klingon')).toEqual([]);
  });
});

describe('selection rules', () => {
  it('toggles without mutating the input', () => {
    const before = new Set(['en']);
    expect([...toggle(before, 'te')].sort()).toEqual(['en', 'te']);
    expect([...toggle(before, 'en')]).toEqual([]);
    expect([...before]).toEqual(['en']);
  });

  it('requires at least one language and three interests', () => {
    expect(canSaveLanguages(new Set())).toBe(false);
    expect(canSaveLanguages(new Set(['en']))).toBe(true);
    expect(canSaveInterests(new Set(['A', 'B']))).toBe(false);
    expect(canSaveInterests(new Set(['A', 'B', 'C']))).toBe(true);
  });

  it('tells the user how many more interests are needed', () => {
    expect(interestCounterText(0)).toBe('0 selected · choose 3 more');
    expect(interestCounterText(2)).toBe('2 selected · choose 1 more');
    expect(interestCounterText(3)).toBe('3 selected');
    expect(interestCounterText(7)).toBe('7 selected');
    expect(interestCounterSpoken(1)).toBe('1 selected, choose 2 more');
    expect(interestCounterSpoken(3)).toBe('3 selected');
  });
});
