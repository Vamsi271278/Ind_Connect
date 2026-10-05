import { minTouchTarget, space, typography } from '@project-connect/design-tokens';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText.js';
import { LoadingIndicator } from './LoadingIndicator.js';
import { useTheme } from './theme.js';

export interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary' | 'tertiary';
  readonly disabled?: boolean;
  /** Shows a spinner, keeps the width and blocks repeat taps. */
  readonly loading?: boolean;
  readonly accessibilityHint?: string;
  readonly testID?: string;
}

/** One dominant action per screen (DESIGN-SYSTEM §42). Rounded rectangle, not a pill. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { button } = useTheme().components;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => {
        if (variant === 'tertiary') {
          return [styles.base, { minHeight: minTouchTarget, paddingHorizontal: space[1] }];
        }
        const shape = {
          minHeight: button.minHeight,
          borderRadius: button.radius,
          paddingHorizontal: button.paddingHorizontal,
        };
        if (disabled) return [styles.base, shape, { backgroundColor: button.disabled.background }];
        if (variant === 'secondary') {
          return [
            styles.base,
            shape,
            styles.outlined,
            {
              borderColor: button.secondary.border,
              backgroundColor: pressed
                ? button.secondary.backgroundPressed
                : button.secondary.background,
            },
          ];
        }
        return [
          styles.base,
          shape,
          {
            backgroundColor: pressed ? button.primary.backgroundPressed : button.primary.background,
          },
        ];
      }}
    >
      <View style={loading ? styles.hidden : null}>
        <AppText
          variant="bodyStrong"
          align="center"
          style={[
            typography.bodyStrong,
            {
              color: disabled
                ? button.disabled.text
                : variant === 'primary'
                  ? button.primary.text
                  : variant === 'secondary'
                    ? button.secondary.text
                    : button.tertiary.text,
            },
          ]}
        >
          {label}
        </AppText>
      </View>
      {loading && (
        <View style={styles.spinner}>
          <LoadingIndicator
            tone={variant === 'primary' ? 'onPrimary' : 'brand'}
            accessibilityLabel={`${label}, loading`}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  outlined: { borderWidth: 1 },
  hidden: { opacity: 0 },
  spinner: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
