// Infrastructure placeholders only (B2.2). Not product UI: B3 replaces these
// with approved designs built on packages/ui.
import { layout, space, typography } from '@project-connect/design-tokens';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from './theme';

export function PlaceholderScreen(props: {
  readonly title: string;
  readonly body?: string;
  readonly busy?: boolean;
  readonly children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={styles.content} accessibilityLiveRegion="polite">
        {props.busy === true && (
          <ActivityIndicator color={colors.action.primary} accessibilityLabel="Loading" />
        )}
        <Text
          accessibilityRole="header"
          style={[typography.headingXl, { color: colors.text.primary }]}
        >
          {props.title}
        </Text>
        {props.body !== undefined && (
          <Text style={[typography.bodyMd, styles.body, { color: colors.text.secondary }]}>
            {props.body}
          </Text>
        )}
        {props.children}
      </View>
    </SafeAreaView>
  );
}

export function PlaceholderButton(props: {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary';
}) {
  const { button } = useTheme().components;
  const primary = props.variant !== 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: button.minHeight,
          borderRadius: button.radius,
          paddingHorizontal: button.paddingHorizontal,
        },
        primary
          ? {
              backgroundColor: pressed
                ? button.primary.backgroundPressed
                : button.primary.background,
            }
          : {
              backgroundColor: button.secondary.background,
              borderColor: button.secondary.border,
              borderWidth: StyleSheet.hairlineWidth * 2,
            },
      ]}
    >
      <Text
        style={[
          typography.labelLg,
          { color: primary ? button.primary.text : button.secondary.text },
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: space[4],
    paddingHorizontal: layout.screenGutter,
  },
  body: { textAlign: 'left' },
  button: { alignItems: 'center', justifyContent: 'center' },
});
