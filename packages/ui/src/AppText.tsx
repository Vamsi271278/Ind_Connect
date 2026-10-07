import { type TypographyVariant, typography } from '@project-connect/design-tokens';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { useTheme } from './theme.js';

export type TextTone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'link' | 'error' | 'onBrand';

export interface AppTextProps extends TextProps {
  readonly variant?: TypographyVariant;
  readonly tone?: TextTone;
  readonly align?: 'auto' | 'left' | 'center' | 'right';
}

const HEADINGS: ReadonlySet<TypographyVariant> = new Set(['display', 'h1', 'h2', 'h3']);

/**
 * All app text. Font scaling is always on (DESIGN-SYSTEM §19); headings are
 * exposed to assistive tech as headers. System font (V1: no font package).
 */
export function AppText({
  variant = 'body',
  tone = 'primary',
  align,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const color = {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    muted: colors.text.muted,
    inverse: colors.text.inverse,
    link: colors.text.link,
    error: colors.error.text,
    onBrand: colors.brand.onCore,
  }[tone];
  return (
    <Text
      accessibilityRole={HEADINGS.has(variant) ? 'header' : undefined}
      {...rest}
      allowFontScaling
      style={[
        typography[variant],
        { color },
        align === undefined ? null : { textAlign: align },
        styles.base,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({ base: { flexShrink: 1 } });
