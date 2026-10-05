import { describe, expect, it } from 'vitest';

import { componentTokens } from './components.js';
import { contrastRatio, WCAG_AA } from './contrast.js';
import { minTouchTarget, space } from './primitives.js';
import { type ColorRoles, darkColors, lightColors } from './semantic.js';

const themes: [string, ColorRoles][] = [
  ['light', lightColors],
  ['dark', darkColors],
];

/** [label, foreground, background, minimum ratio] */
const pairsFor = (c: ColorRoles): [string, string, string, number][] => [
  ...(['primary', 'secondary', 'tertiary'] as const).flatMap((level) =>
    (['primary', 'secondary'] as const).flatMap((bg): [string, string, string, number][] => [
      [`text.${level} on background.${bg}`, c.text[level], c.background[bg], WCAG_AA.text],
      [`text.${level} on surface.${bg}`, c.text[level], c.surface[bg], WCAG_AA.text],
    ]),
  ),
  ['action.onPrimary on action.primary', c.action.onPrimary, c.action.primary, WCAG_AA.text],
  [
    'action.onPrimary on action.primaryPressed',
    c.action.onPrimary,
    c.action.primaryPressed,
    WCAG_AA.text,
  ],
  [
    'action.primary on background.primary (UI)',
    c.action.primary,
    c.background.primary,
    WCAG_AA.uiComponent,
  ],
  [
    'border.strong on surface.primary (input boundary)',
    c.border.strong,
    c.surface.primary,
    WCAG_AA.uiComponent,
  ],
  [
    'border.focus on surface.primary (focus ring)',
    c.border.focus,
    c.surface.primary,
    WCAG_AA.uiComponent,
  ],
  ...(['success', 'warning', 'error', 'info'] as const).map(
    (status): [string, string, string, number] => [
      `${status}.text on ${status}.background`,
      c[status].text,
      c[status].background,
      WCAG_AA.text,
    ],
  ),
  ['error.text on surface.primary (field error)', c.error.text, c.surface.primary, WCAG_AA.text],
  [
    'verification on background.primary (UI)',
    c.verification,
    c.background.primary,
    WCAG_AA.uiComponent,
  ],
  [
    'context.dating on background.primary (UI)',
    c.context.dating,
    c.background.primary,
    WCAG_AA.uiComponent,
  ],
];

describe('WCAG 2.2 AA contrast (DESIGN-SYSTEM §14)', () => {
  for (const [name, colors] of themes) {
    describe(name, () => {
      it.each(pairsFor(colors))('%s', (_label, foreground, background, minimum) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
      });
    });
  }
});

describe('token structure', () => {
  it('light and dark define exactly the same semantic roles', () => {
    const shape = (value: unknown): unknown =>
      typeof value === 'object' && value !== null
        ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]))
        : typeof value;
    expect(shape(darkColors)).toEqual(shape(lightColors));
  });

  it('uses the 4-point grid and 44pt touch targets', () => {
    for (const value of Object.values(space)) expect(value % 4).toBe(0);
    for (const [, colors] of themes) {
      const tokens = componentTokens(colors);
      expect(tokens.button.minHeight).toBeGreaterThanOrEqual(minTouchTarget);
      expect(tokens.input.minHeight).toBeGreaterThanOrEqual(minTouchTarget);
    }
  });

  it('contrast math matches known WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });
});
