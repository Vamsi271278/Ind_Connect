/**
 * Primitive tokens (DESIGN-SYSTEM §36–§37). Raw values live ONLY here; feature
 * code uses semantic and component tokens.
 */

// PROVISIONAL — replace after approved visual/Figma direction.
// These colours are accessible infrastructure placeholders (WCAG 2.2 AA tested),
// not Project Connect's approved brand design. DESIGN-SYSTEM §7 leaves exact
// values to visual design; only this block changes when they are approved.
export const palette = {
  /** Deep indigo / blue-violet family (§7). */
  brand: {
    50: '#EEF0FF',
    100: '#E0E3FF',
    200: '#C6CBFF',
    300: '#A3A8FB',
    400: '#8C8DF5',
    500: '#5B5BD6',
    600: '#4A47C2',
    700: '#3D399E',
    800: '#322F7D',
    900: '#26245C',
  },
  /** Soft coral / warm rose accent, used sparingly (§8). */
  accent: {
    50: '#FFF1EE',
    100: '#FFE0DA',
    300: '#F59A8C',
    500: '#E8604E',
    600: '#C2412F',
    700: '#9C3122',
    900: '#3A1610',
  },
  /** Neutral scale (§9). */
  neutral: {
    0: '#FFFFFF',
    25: '#FCFCFD',
    50: '#F7F7F9',
    100: '#EFEFF3',
    200: '#E2E2E9',
    300: '#CBCBD6',
    400: '#A3A3B3',
    500: '#6E6E80',
    600: '#5C5C6E',
    700: '#45455A',
    800: '#2E2E3D',
    900: '#1C1C28',
    950: '#111119',
  },
  success: {
    light: '#E8F7EE',
    base: '#17663A',
    border: '#8FD3A8',
    dark: '#0F2A1C',
    onDark: '#7EE2A8',
  },
  warning: {
    light: '#FFF6E0',
    base: '#8A5300',
    border: '#F2C46B',
    dark: '#2B2010',
    onDark: '#F7C86B',
  },
  error: {
    light: '#FDECEC',
    base: '#B42318',
    border: '#F1A7A0',
    dark: '#2A1212',
    onDark: '#FDA29B',
  },
  info: {
    light: '#EAF2FF',
    base: '#1D4ED8',
    border: '#9EBBF5',
    dark: '#111C33',
    onDark: '#9EBBF5',
  },
  /** Brand-adjacent blue for verification (§12) — not "celebrity" blue. */
  verification: { light: '#3B6FD9', dark: '#8DB1FF' },
} as const;

/** 4-point spacing scale (§21). */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Radius scale (§25). */
export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

/** Font weights (§18), as React Native accepts them. */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Icon sizes (§30). */
export const iconSize = { sm: 16, md: 20, lg: 24, xl: 32 } as const;

/** Elevation levels (§27); dark mode relies on tonal surfaces instead (§28). */
export const elevation = { 0: 0, 1: 1, 2: 2, 3: 3, overlay: 4 } as const;

/** Minimum interactive target (§31): 44×44pt. */
export const minTouchTarget = 44;

/** Layout (§22–§23). */
export const layout = {
  screenGutter: space[5],
  screenGutterDense: space[4],
  sectionGap: space[6],
} as const;
