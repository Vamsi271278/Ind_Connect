import { describe, expect, it } from 'vitest';

import { firstNameSchema, genderSelfDescriptionSchema } from './profile.js';

describe('firstNameSchema', () => {
  it.each([
    ['Ananya', 'Ananya'],
    ["D'Souza", "D'Souza"],
    ['Mary-Jane', 'Mary-Jane'],
    ['  Ravi   Kumar  ', 'Ravi Kumar'],
    ['आर्या', 'आर्या'],
    ['José', 'José'],
    ['O’Neil', 'O’Neil'],
  ])('accepts %j', (input, expected) => {
    expect(firstNameSchema.parse(input)).toBe(expected);
  });

  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['digits / phone number', '214 555 0123'],
    ['url', 'example.com'],
    ['url with scheme', 'https://x.io'],
    ['emoji only', '😀'],
    ['emoji mixed', 'Ravi 😀'],
    ['leading hyphen', '-Ravi'],
    ['trailing apostrophe', "Ravi'"],
    ['double separator', 'Ravi--Kumar'],
    ['at sign', 'ravi@x'],
    ['too long', 'a'.repeat(51)],
  ])('rejects %s', (_label, input) => {
    expect(firstNameSchema.safeParse(input).success).toBe(false);
  });

  it('allows exactly 50 characters', () => {
    expect(firstNameSchema.safeParse('a'.repeat(50)).success).toBe(true);
  });
});

describe('genderSelfDescriptionSchema', () => {
  it('accepts short descriptive text and rejects URLs, digits and over-length', () => {
    expect(genderSelfDescriptionSchema.parse(' Genderfluid ')).toBe('Genderfluid');
    expect(genderSelfDescriptionSchema.safeParse('see example.com').success).toBe(false);
    expect(genderSelfDescriptionSchema.safeParse('a'.repeat(81)).success).toBe(false);
  });
});
