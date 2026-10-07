import { radius, space } from '@project-connect/design-tokens';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText.js';
import { useTheme } from './theme.js';

export interface InlineMessageProps {
  readonly tone: 'error' | 'info' | 'success';
  readonly message: string;
}

/**
 * Inline / banner message (DESIGN-SYSTEM §140). Status is conveyed by an icon
 * glyph and wording as well as colour (§128). Errors are announced.
 */
export function InlineMessage({ tone, message }: InlineMessageProps) {
  const { colors } = useTheme();
  const role = colors[tone];
  return (
    <View
      accessible
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      accessibilityLabel={message}
      style={[styles.box, { backgroundColor: role.background }]}
    >
      <StatusGlyph tone={tone} color={role.text} />
      <AppText variant="caption" style={[styles.text, { color: role.text }]}>
        {message}
      </AppText>
    </View>
  );
}

/** Small circled glyph (`!`, `i` or a check) drawn with text — no icon library. */
export function StatusGlyph({
  tone,
  color,
}: {
  readonly tone: 'error' | 'info' | 'success';
  readonly color: string;
}) {
  const glyph = { error: '!', info: 'i', success: '✓' }[tone];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.glyph, { borderColor: color }]}
    >
      <AppText variant="small" style={[styles.glyphText, { color }]} allowFontScaling={false}>
        {glyph}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.md,
  },
  text: { flex: 1 },
  glyph: {
    width: 18,
    height: 18,
    marginTop: 1,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphText: { fontSize: 11, lineHeight: 13, fontWeight: '700' },
});
