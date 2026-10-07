import { fontWeight, palette } from './primitives.js';

/** Semantic colour roles (DESIGN-SYSTEM §10–§12). Feature code binds to these. */
export interface ColorRoles {
  readonly background: { readonly primary: string; readonly secondary: string };
  readonly surface: {
    readonly primary: string;
    readonly secondary: string;
    /** Selected selection rows / chips. */
    readonly selected: string;
  };
  readonly text: {
    readonly primary: string;
    /** Body copy, helper text, captions and placeholders (≥ 4.5:1). */
    readonly secondary: string;
    /** Large or non-essential text only (≥ 3:1). */
    readonly muted: string;
    readonly inverse: string;
    readonly disabled: string;
    readonly link: string;
  };
  readonly border: {
    /** Decorative dividers and card outlines. */
    readonly default: string;
    /** Input / selection boundaries (≥ 3:1, WCAG 1.4.11). */
    readonly field: string;
    readonly focus: string;
  };
  readonly action: {
    readonly primary: string;
    readonly primaryPressed: string;
    readonly onPrimary: string;
    readonly disabled: string;
    readonly onDisabled: string;
  };
  /** Brand moments: splash background, logo. */
  readonly brand: { readonly core: string; readonly onCore: string; readonly mark: string };
  /** Low-prominence background shapes and abstract artwork. */
  readonly decor: {
    readonly indigo: string;
    readonly indigoSoft: string;
    readonly coral: string;
    readonly coralSoft: string;
    readonly teal: string;
    readonly tealSoft: string;
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
  background: { primary: p.neutral[25], secondary: p.neutral[50] },
  surface: { primary: p.neutral[0], secondary: p.brand[50], selected: p.brand[50] },
  text: {
    primary: p.ink,
    secondary: p.neutral[600],
    muted: p.neutral[500],
    inverse: p.neutral[0],
    disabled: p.neutral[500],
    link: p.brand[600],
  },
  border: { default: p.neutral[200], field: p.neutral[500], focus: p.brand[500] },
  action: {
    primary: p.brand[600],
    primaryPressed: p.brand[700],
    onPrimary: p.neutral[0],
    disabled: p.neutral[200],
    onDisabled: p.neutral[500],
  },
  brand: { core: p.brand[500], onCore: p.neutral[0], mark: p.brand[600] },
  decor: {
    indigo: p.brand[300],
    indigoSoft: p.brand[100],
    coral: p.accent[500],
    coralSoft: p.accent[100],
    teal: p.teal[500],
    tealSoft: p.teal[100],
  },
  success: { background: p.success.light, text: p.success.base, border: p.success.border },
  warning: { background: p.warning.light, text: p.warning.base, border: p.warning.border },
  error: { background: p.error.light, text: p.error.base, border: p.error.border },
  info: { background: p.info.light, text: p.info.base, border: p.info.border },
  context: { dating: p.accent[600], datingSoft: p.accent[50] },
  verification: p.verification.light,
};

/** Dark mode: same identity, tonal surfaces, softened brand (ADR-092). */
export const darkColors: ColorRoles = {
  background: { primary: p.neutral[950], secondary: p.neutral[925] },
  surface: { primary: p.neutral[900], secondary: p.neutral[850], selected: p.brandOnDark.soft },
  text: {
    primary: p.neutral[50],
    secondary: p.neutral[300],
    muted: p.neutral[400],
    inverse: p.neutral[950],
    disabled: p.neutral[500],
    link: p.brand[300],
  },
  border: { default: p.neutral[800], field: p.neutral[500], focus: p.brandOnDark.base },
  action: {
    primary: p.brandOnDark.base,
    primaryPressed: p.brandOnDark.pressed,
    onPrimary: p.neutral[950],
    disabled: p.neutral[800],
    onDisabled: p.neutral[400],
  },
  brand: { core: p.brand[500], onCore: p.neutral[0], mark: p.brand[300] },
  decor: {
    indigo: p.brandOnDark.base,
    indigoSoft: p.brandOnDark.soft,
    coral: p.accent[400],
    coralSoft: p.decorOnDark.coral,
    teal: p.teal[500],
    tealSoft: p.decorOnDark.teal,
  },
  success: { background: p.success.dark, text: p.success.onDark, border: p.success.border },
  warning: { background: p.warning.dark, text: p.warning.onDark, border: p.warning.base },
  error: { background: p.error.dark, text: p.error.onDark, border: p.error.borderOnDark },
  info: { background: p.info.dark, text: p.info.onDark, border: p.info.border },
  context: { dating: p.accent[400], datingSoft: p.decorOnDark.coral },
  verification: p.verification.dark,
};

/** Type roles (V1 §4). Sizes scale with Dynamic Type / font scale at render (§19). */
export interface TextStyleToken {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: (typeof fontWeight)[keyof typeof fontWeight];
}

export const typography = {
  display: { fontSize: 36, lineHeight: 42, fontWeight: fontWeight.bold },
  h1: { fontSize: 30, lineHeight: 36, fontWeight: fontWeight.bold },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: fontWeight.bold },
  h3: { fontSize: 20, lineHeight: 26, fontWeight: fontWeight.semibold },
  bodyLarge: { fontSize: 18, lineHeight: 27, fontWeight: fontWeight.regular },
  body: { fontSize: 16, lineHeight: 24, fontWeight: fontWeight.regular },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: fontWeight.semibold },
  label: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.semibold },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: fontWeight.regular },
  small: { fontSize: 12, lineHeight: 16, fontWeight: fontWeight.medium },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyVariant = keyof typeof typography;

export type ColorScheme = 'light' | 'dark';

export const colorsFor = (scheme: ColorScheme): ColorRoles =>
  scheme === 'dark' ? darkColors : lightColors;
