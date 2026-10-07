import type { IntentOption } from '@project-connect/api-contracts';
import { describe, expect, it } from 'vitest';

import { canContinue, intentRows, savedSocialSelection, toggleSocial } from './intent-selection';

const option = (code: IntentOption['code'], label: string): IntentOption => ({
  code,
  label,
  description: `${label} description`,
});
const SOCIAL = [
  option('FRIENDSHIP', 'Friendship'),
  option('ACTIVITIES', 'Activities'),
  option('NETWORKING', 'Professional networking'),
];
const WITH_DATING = [...SOCIAL, option('DATING', 'Dating')];

describe('intentRows', () => {
  it('checks social rows from the selection and Dating only from datingEnabled', () => {
    const rows = intentRows({
      options: WITH_DATING,
      socialSelection: new Set(['ACTIVITIES']),
      datingEnabled: false,
    });
    expect(rows.map((r) => [r.code, r.checked])).toEqual([
      ['FRIENDSHIP', false],
      ['ACTIVITIES', true],
      ['NETWORKING', false],
      ['DATING', false],
    ]);
  });

  it('has no Dating row while the kill switch is off and Dating is off', () => {
    const rows = intentRows({ options: SOCIAL, socialSelection: new Set(), datingEnabled: false });
    expect(rows.map((r) => r.code)).not.toContain('DATING');
  });

  it('keeps an active Dating visible (to turn it off) even when no longer offered', () => {
    const rows = intentRows({ options: SOCIAL, socialSelection: new Set(), datingEnabled: true });
    expect(rows.at(-1)).toMatchObject({ code: 'DATING', checked: true });
  });
});

describe('selection rules', () => {
  it('restores saved social intents, never DATING, as the selection', () => {
    expect([...savedSocialSelection(['FRIENDSHIP', 'DATING'])]).toEqual(['FRIENDSHIP']);
  });

  it('requires at least one intent, counting Dating', () => {
    expect(canContinue(new Set(), false)).toBe(false);
    expect(canContinue(new Set(), true)).toBe(true);
    expect(canContinue(new Set(['NETWORKING']), false)).toBe(true);
  });

  it('toggles a social intent without mutating the input', () => {
    const before = new Set<'FRIENDSHIP' | 'ACTIVITIES' | 'NETWORKING'>(['FRIENDSHIP']);
    const after = toggleSocial(before, 'ACTIVITIES');
    expect([...after].sort()).toEqual(['ACTIVITIES', 'FRIENDSHIP']);
    expect([...toggleSocial(after, 'FRIENDSHIP')]).toEqual(['ACTIVITIES']);
    expect([...before]).toEqual(['FRIENDSHIP']);
  });
});
