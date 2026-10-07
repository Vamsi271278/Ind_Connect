import { layout, minTouchTarget, radius, space } from './primitives.js';
import type { ColorRoles } from './semantic.js';

/**
 * Component tokens for the B3 primitives in packages/ui (V1 §7–§9). Built
 * from semantic roles so light/dark switch automatically.
 */
export const componentTokens = (colors: ColorRoles) =>
  ({
    button: {
      minHeight: 54,
      radius: radius.button,
      paddingHorizontal: space[5],
      primary: {
        background: colors.action.primary,
        backgroundPressed: colors.action.primaryPressed,
        text: colors.action.onPrimary,
      },
      secondary: {
        background: colors.surface.primary,
        backgroundPressed: colors.surface.secondary,
        border: colors.action.primary,
        text: colors.text.link,
      },
      tertiary: { text: colors.text.link },
      /** Explicit disabled colours — never just lowered opacity. */
      disabled: { background: colors.action.disabled, text: colors.action.onDisabled },
      focusRing: colors.border.focus,
    },
    input: {
      minHeight: 56,
      radius: radius.input,
      paddingHorizontal: space[4],
      borderWidth: 1,
      focusBorderWidth: 2,
      background: colors.surface.primary,
      text: colors.text.primary,
      placeholder: colors.text.secondary,
      label: colors.text.primary,
      helper: colors.text.secondary,
      border: colors.border.field,
      borderFocus: colors.border.focus,
      borderError: colors.error.border,
      errorText: colors.error.text,
      disabled: {
        background: colors.background.secondary,
        border: colors.border.default,
        text: colors.text.disabled,
      },
      divider: colors.border.default,
    },
    otpSlot: { width: 48, height: 56, radius: radius.md },
    selectionRow: {
      minHeight: 56,
      radius: radius.input,
      gap: space[3],
      background: colors.surface.primary,
      border: colors.border.field,
      selectedBackground: colors.surface.selected,
      selectedBorder: colors.action.primary,
      indicatorSize: 22,
      indicator: colors.border.field,
      indicatorSelected: colors.action.primary,
    },
    backButton: { size: Math.max(layout.backHitTarget, minTouchTarget), icon: colors.text.primary },
  }) as const;

export type ComponentTokens = ReturnType<typeof componentTokens>;
