import { layout } from '@project-connect/design-tokens';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from './theme.js';

/** Stroke chevron drawn with two borders — no icon library needed for B3. */
export function Chevron({
  direction,
  color,
  size = 11,
}: {
  readonly direction: 'left' | 'down';
  readonly color: string;
  readonly size?: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.chevron,
        {
          width: size,
          height: size,
          borderColor: color,
          transform: [{ rotate: direction === 'left' ? '45deg' : '-45deg' }],
          marginLeft: direction === 'left' ? size / 3 : 0,
          marginTop: direction === 'down' ? -size / 3 : 0,
        },
      ]}
    />
  );
}

/** 48×48 back control for the top-left of auth/onboarding screens (V1 §13). */
export function BackButton({
  onPress,
  label = 'Back',
}: {
  readonly onPress: () => void;
  readonly label?: string;
}) {
  const { backButton } = useTheme().components;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={[styles.button, { width: backButton.size, height: backButton.size }]}
    >
      <Chevron direction="left" color={backButton.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chevron: { borderLeftWidth: 2, borderBottomWidth: 2, borderTopWidth: 0, borderRightWidth: 0 },
  // Optically align the chevron with the screen gutter.
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -(layout.backHitTarget - 24) / 2,
  },
});
