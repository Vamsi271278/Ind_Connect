import { fontWeight, palette } from './primitives.js';

/** Semantic colour roles (DESIGN-SYSTEM §10–§12). Feature code binds to these. */
export interface ColorRoles {
  readonly background: { readonly primary: string; readonly secondary: string };
  readonly surface: { readonly primary: string; readonly secondary: string };
  readonly text: {
    readonly primary: string;
    readonly secondary: string;
    readonly tertiary: string;
    readonly inverse: string;
    readonly disabled: string;
  };
  readonly border: { readonly default: string; readonly strong: string; readonly focus: string };
  readonly action: {
    readonly primary: string;
    readonly primaryPressed: string;
    readonly secondary: string;
    readonly onPrimary: string;
  };
  readonly success: StatusRole;
  readonly warning: StatusRole;
  readonly error: StatusRole;
  readonly info: StatusRole;
  readonly context: { readonly dating: string; readonly datingSoft: string };
  readonly verification: string;
}

export interface StatusRole {
  readonly background: string;
  readonly text: string;
  readonly border: string;
}

const p = palette;

export const lightColors: ColorRoles = {
  background: { primary: p.neutral[0], secondary: p.neutral[50] },
  surface: { primary: p.neutral[0], secondary: p.neutral[50] },
  text: {
    primary: p.neutral[900],
    secondary: p.neutral[600],
    tertiary: p.neutral[500],
    inverse: p.neutral[0],
    disabled: p.neutral[400],
  },
  border: { default: p.neutral[200], strong: p.neutral[500], focus: p.brand[600] },
  action: {
    primary: p.brand[600],
    primaryPressed: p.brand[700],
    secondary: p.brand[50],
    onPrimary: p.neutral[0],
  },
  success: { background: p.success.light, text: p.success.base, border: p.success.border },
  warning: { background: p.warning.light, text: p.warning.base, border: p.warning.border },
  error: { background: p.error.light, text: p.error.base, border: p.error.border },
  info: { background: p.info.light, text: p.info.base, border: p.info.border },
  context: { dating: p.accent[600], datingSoft: p.accent[50] },
  verification: p.verification.light,
};

/** Dark mode via semantic tokens (ADR-092): tonal surfaces, not shadows. */
export const darkColors: ColorRoles = {
  background: { primary: p.neutral[950], secondary: p.neutral[900] },
  surface: { primary: p.neutral[900], secondary: p.neutral[800] },
  text: {
    primary: p.neutral[50],
    secondary: p.neutral[300],
    tertiary: p.neutral[400],
    inverse: p.neutral[950],
    disabled: p.neutral[600],
  },
  border: { default: p.neutral[800], strong: p.neutral[500], focus: p.brand[400] },
  action: {
    primary: p.brand[400],
    primaryPressed: p.brand[300],
    secondary: p.neutral[800],
    onPrimary: p.neutral[950],
  },
  success: { background: p.success.dark, text: p.success.onDark, border: p.success.base },
  warning: { background: p.warning.dark, text: p.warning.onDark, border: p.warning.base },
  error: { background: p.error.dark, text: p.error.onDark, border: p.error.base },
  info: { background: p.info.dark, text: p.info.onDark, border: p.info.base },
  context: { dating: p.accent[300], datingSoft: p.accent[900] },
  verification: p.verification.dark,
};

/** Type roles (§16–§17). Sizes scale with Dynamic Type at render (§19). */
export interface TextStyleToken {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: (typeof fontWeight)[keyof typeof fontWeight];
}

export const typography = {
  displayLarge: { fontSize: 32, lineHeight: 40, fontWeight: fontWeight.bold },
  displayMedium: { fontSize: 28, lineHeight: 36, fontWeight: fontWeight.bold },
  headingXl: { fontSize: 24, lineHeight: 32, fontWeight: fontWeight.semibold },
  headingLg: { fontSize: 22, lineHeight: 30, fontWeight: fontWeight.semibold },
  headingMd: { fontSize: 20, lineHeight: 28, fontWeight: fontWeight.semibold },
  headingSm: { fontSize: 18, lineHeight: 24, fontWeight: fontWeight.semibold },
  bodyLg: { fontSize: 17, lineHeight: 24, fontWeight: fontWeight.regular },
  bodyMd: { fontSize: 16, lineHeight: 22, fontWeight: fontWeight.regular },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.regular },
  labelLg: { fontSize: 16, lineHeight: 20, fontWeight: fontWeight.medium },
  labelMd: { fontSize: 14, lineHeight: 18, fontWeight: fontWeight.medium },
  labelSm: { fontSize: 12, lineHeight: 16, fontWeight: fontWeight.medium },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: fontWeight.regular },
} as const satisfies Record<string, TextStyleToken>;

export type ColorScheme = 'light' | 'dark';

export const colorsFor = (scheme: ColorScheme): ColorRoles =>
  scheme === 'dark' ? darkColors : lightColors;
