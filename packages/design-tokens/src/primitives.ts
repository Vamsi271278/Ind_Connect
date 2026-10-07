/**
 * Primitive tokens (DESIGN-SYSTEM §36–§37). Raw values live ONLY here; feature
 * code uses semantic and component tokens.
 */

// Project Connect Visual Identity V1 (approved for B3, 2026-10-04). Values
// marked "a11y" were adjusted from the identity sheet to satisfy WCAG 2.2 AA;
// tokens.test.ts is the authority — fix a failing primitive, never the standard.
export const palette = {
  /** Connect Indigo. 500 is the core brand; 600 carries white text. */
  brand: {
    50: '#F6F5FF',
    100: '#EBEAFF',
    200: '#CBC9FA',
    300: '#A29EF5',
    400: '#7872EF',
    500: '#5B55E7',
    600: '#4F46C8',
    700: '#3F37A4',
    800: '#312A7C',
    900: '#25205F',
  },
  /** Warm Coral — personality, never the primary action (§8). */
  accent: {
    50: '#FFF5F3',
    100: '#FFE9E6',
    400: '#F78379',
    500: '#EF675B',
    600: '#D94F43',
  },
  /** Community Teal — success and community moments, sparingly. */
  teal: {
    50: '#F1FBF9',
    100: '#DCF5F1',
    500: '#219C8E',
    600: '#178277',
    700: '#12675F',
  },
  /** Slightly cool neutrals (§9). */
  neutral: {
    0: '#FFFFFF',
    25: '#FBFAFD',
    50: '#F7F7F9',
    100: '#EEEEF2',
    200: '#DEDEE4',
    300: '#C6C6CD',
    400: '#A0A0AA',
    500: '#7D7D88',
    600: '#62626E',
    700: '#484854',
    800: '#30303B',
    850: '#21212B',
    900: '#191921',
    925: '#17171F',
    950: '#111118',
  },
  /** Primary text ink (#20202A in the identity sheet). */
  ink: '#20202A',
  /** Dark-mode brand (lighter indigo; carries dark text). */
  brandOnDark: { base: '#8A84F2', pressed: '#A29EF5', soft: '#2A2850' },
  success: {
    light: '#F1FBF9',
    base: '#12675F',
    border: '#219C8E',
    dark: '#0F2A26',
    onDark: '#7FD8CB',
  },
  warning: {
    light: '#FFF6E0',
    base: '#8A5300',
    border: '#F2C46B',
    dark: '#2B2010',
    onDark: '#F7C86B',
  },
  /** a11y: #C53E3E for borders/large marks; #A93232 for small text on tints. */
  error: {
    light: '#FDECEC',
    base: '#A93232',
    border: '#C53E3E',
    dark: '#2A1212',
    onDark: '#FDA29B',
    borderOnDark: '#E06666',
  },
  info: {
    light: '#F6F5FF',
    base: '#3F37A4',
    border: '#A29EF5',
    dark: '#21212B',
    onDark: '#CBC9FA',
  },
  /** Verification mark (§12) — not "celebrity" blue. */
  verification: { light: '#3B6FD9', dark: '#8DB1FF' },
  /** Decorative tints for dark-mode background shapes and artwork. */
  decorOnDark: { coral: '#3A2630', teal: '#18332F' },
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
  20: 80,
} as const;

/** Radius scale — soft, not bubbly. Buttons are rounded rectangles, not pills. */
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  input: 14,
  button: 16,
  card: 20,
  panel: 28,
  full: 999,
} as const;

/** Font weights (§18), as React Native accepts them. No ultralight. */
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

/** Minimum interactive target (§31): 44×44pt. Back buttons use 48. */
export const minTouchTarget = 44;

/** Layout (V1 §5). */
export const layout = {
  screenGutter: space[6],
  screenGutterCompact: space[5],
  headingToSubtitle: space[3],
  subtitleToForm: space[8],
  fieldGap: space[4],
  formToAction: space[6],
  bottomSafeSpacing: space[6],
  topControlHeight: 52,
  backHitTarget: 48,
  /** Forms never stretch across a tablet. */
  maxContentWidth: 520,
} as const;

/** Motion durations in ms (V1 §14). Honour reduced motion at the call site. */
export const motion = {
  press: 120,
  selection: 160,
  error: 150,
} as const;
