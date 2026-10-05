import { minTouchTarget, radius, space } from './primitives.js';
import type { ColorRoles } from './semantic.js';

/**
 * Minimal component tokens (DESIGN-SYSTEM §39, §42–§53) for B3's first
 * screens. Built from semantic roles so light/dark switch automatically.
 */
export const componentTokens = (colors: ColorRoles) =>
  ({
    button: {
      primary: {
        background: colors.action.primary,
        backgroundPressed: colors.action.primaryPressed,
        text: colors.action.onPrimary,
        backgroundDisabled: colors.border.default,
        textDisabled: colors.text.disabled,
      },
      secondary: {
        background: colors.surface.primary,
        border: colors.border.strong,
        text: colors.text.primary,
      },
      radius: radius.lg,
      minHeight: Math.max(48, minTouchTarget),
      paddingHorizontal: space[5],
    },
    input: {
      background: colors.surface.primary,
      text: colors.text.primary,
      placeholder: colors.text.tertiary,
      label: colors.text.secondary,
      border: colors.border.strong,
      borderFocus: colors.border.focus,
      borderError: colors.error.text,
      errorText: colors.error.text,
      radius: radius.md,
      minHeight: Math.max(48, minTouchTarget),
      paddingHorizontal: space[4],
    },
  }) as const;

export type ComponentTokens = ReturnType<typeof componentTokens>;
