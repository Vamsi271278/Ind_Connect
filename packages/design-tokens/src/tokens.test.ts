import { describe, expect, it } from 'vitest';

import { componentTokens } from './components.js';
import { contrastRatio, WCAG_AA } from './contrast.js';
import { minTouchTarget, space } from './primitives.js';
import { type ColorRoles, darkColors, lightColors } from './semantic.js';

const themes: [string, ColorRoles][] = [
  ['light', lightColors],
  ['dark', darkColors],
];

type Pair = [label: string, foreground: string, background: string, minimum: number];

/** Every foreground/background combination the B3 primitives actually render. */
const pairsFor = (c: ColorRoles): Pair[] => {
  const grounds: [string, string][] = [
    ['background.primary', c.background.primary],
    ['background.secondary', c.background.secondary],
    ['surface.primary', c.surface.primary],
    ['surface.secondary', c.surface.secondary],
    ['surface.selected', c.surface.selected],
  ];
  return [
    ...grounds.flatMap(([name, ground]): Pair[] => [
      [`text.primary on ${name}`, c.text.primary, ground, WCAG_AA.text],
      [`text.secondary on ${name}`, c.text.secondary, ground, WCAG_AA.text],
      [`text.link on ${name}`, c.text.link, ground, WCAG_AA.text],
      // Muted is reserved for large / non-essential text.
      [`text.muted on ${name} (large text)`, c.text.muted, ground, WCAG_AA.uiComponent],
      [`border.field on ${name} (input boundary)`, c.border.field, ground, WCAG_AA.uiComponent],
      [`border.focus on ${name} (focus ring)`, c.border.focus, ground, WCAG_AA.uiComponent],
      [`action.primary on ${name} (button shape)`, c.action.primary, ground, WCAG_AA.uiComponent],
      [`error.border on ${name}`, c.error.border, ground, WCAG_AA.uiComponent],
    ]),
    ['action.onPrimary on action.primary', c.action.onPrimary, c.action.primary, WCAG_AA.text],
    [
      'action.onPrimary on action.primaryPressed',
      c.action.onPrimary,
      c.action.primaryPressed,
      WCAG_AA.text,
    ],
    ['brand.onCore on brand.core (splash wordmark)', c.brand.onCore, c.brand.core, WCAG_AA.text],
    [
      'brand.mark on background.primary (logo)',
      c.brand.mark,
      c.background.primary,
      WCAG_AA.uiComponent,
    ],
    ['error.text on surface.primary (field error)', c.error.text, c.surface.primary, WCAG_AA.text],
    [
      'error.text on background.primary (field error)',
      c.error.text,
      c.background.primary,
      WCAG_AA.text,
    ],
    ...(['success', 'warning', 'error', 'info'] as const).map((status): Pair => [
      `${status}.text on ${status}.background`,
      c[status].text,
      c[status].background,
      WCAG_AA.text,
    ]),
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
};

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
