import { radius } from '@project-connect/design-tokens';
import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText.js';
import { useTheme } from './theme.js';

export interface AppLogoProps {
  /** Mark size in points. */
  readonly size?: number;
  /** `onBrand` = white mark for the indigo splash. */
  readonly tone?: 'default' | 'onBrand';
  readonly wordmark?: 'none' | 'beside' | 'below';
}

/**
 * PROVISIONAL BRAND MARK — "Connect Loop": two curved forms facing each other
 * (person ↔ person, a conversation), each ending in a dot. Drawn with native
 * views so B3 needs no SVG dependency: each curve is a ring with two adjacent
 * borders coloured (a clean half ring), rotated into place. Replace with the
 * final asset after the name/logo exercise. "Project Connect" is a working name.
 */
export function AppLogo({ size = 40, tone = 'default', wordmark = 'none' }: AppLogoProps) {
  const { colors } = useTheme();
  const stroke = Math.max(3, Math.round(size * 0.12));
  const ring = size * 0.62;
  const dot = Math.round(stroke * 1.5);
  const markColor = tone === 'onBrand' ? colors.brand.onCore : colors.brand.mark;
  const dotA = tone === 'onBrand' ? colors.brand.onCore : colors.decor.coral;
  const dotB = tone === 'onBrand' ? colors.brand.onCore : colors.decor.teal;

  // Left "(" sits low-left, right ")" sits high-right; they overlap slightly.
  const leftX = size * 0.06;
  const leftY = size * 0.3;
  const rightX = size - ring - size * 0.06;
  const rightY = size * 0.08;

  const mark = (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          styles.arc,
          {
            width: ring,
            height: ring,
            left: leftX,
            top: leftY,
            borderWidth: stroke,
            borderLeftColor: markColor,
            borderBottomColor: markColor,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.arc,
          {
            width: ring,
            height: ring,
            left: rightX,
            top: rightY,
            borderWidth: stroke,
            borderRightColor: markColor,
            borderTopColor: markColor,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      {/* Endpoint dots: top of the left curve, bottom of the right curve. */}
      <View
        style={[
          styles.dot,
          {
            width: dot,
            height: dot,
            backgroundColor: dotA,
            left: leftX + ring / 2 - dot / 2,
            top: leftY - dot * 0.15,
          },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            width: dot,
            height: dot,
            backgroundColor: dotB,
            left: rightX + ring / 2 - dot / 2,
            top: rightY + ring - dot * 0.85,
          },
        ]}
      />
    </View>
  );

  if (wordmark === 'none') {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel="Project Connect">
        {mark}
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Project Connect"
      style={wordmark === 'beside' ? styles.beside : styles.below}
    >
      {mark}
      <AppText
        variant={wordmark === 'below' ? 'display' : 'bodyStrong'}
        tone={tone === 'onBrand' ? 'onBrand' : 'primary'}
        accessibilityRole="none"
      >
        {wordmark === 'below' ? 'Connect' : 'Project Connect'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  arc: { position: 'absolute', borderRadius: radius.full, borderColor: 'transparent' },
  dot: { position: 'absolute', borderRadius: radius.full },
  beside: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  below: { alignItems: 'center', gap: 16 },
});
