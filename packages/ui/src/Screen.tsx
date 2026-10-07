import { layout, radius, space } from '@project-connect/design-tokens';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from './theme.js';

export interface ScreenProps {
  /** Top control area (52pt), e.g. a BackButton. Omit for none. */
  readonly topControl?: ReactNode;
  /** Content rendered edge-to-edge above the padded body (e.g. hero artwork). */
  readonly hero?: ReactNode;
  readonly children: ReactNode;
  /** Primary action area: sits after the content, never over the keyboard. */
  readonly footer?: ReactNode;
  /** One very subtle background shape (V1 §10). */
  readonly decoration?: 'none' | 'indigo' | 'coral' | 'teal';
  readonly background?: 'default' | 'brand';
  /** Centre the body vertically (status-style screens). */
  readonly centered?: boolean;
  readonly testID?: string;
}

/**
 * Safe-area, keyboard-aware, scrollable screen with the V1 gutter and a 520pt
 * max content width. Large text scrolls instead of clipping actions (§129).
 */
export function Screen({
  topControl,
  hero,
  children,
  footer,
  decoration = 'none',
  background = 'default',
  centered = false,
  testID,
}: ScreenProps) {
  const { colors } = useTheme();
  const backgroundColor = background === 'brand' ? colors.brand.core : colors.background.primary;
  const shapeColor =
    decoration === 'indigo'
      ? colors.decor.indigoSoft
      : decoration === 'coral'
        ? colors.decor.coralSoft
        : decoration === 'teal'
          ? colors.decor.tealSoft
          : undefined;

  return (
    <View style={[styles.root, { backgroundColor }]} testID={testID}>
      {shapeColor !== undefined && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.shape, { backgroundColor: shapeColor }]}
        />
      )}
      <SafeAreaView style={styles.root} edges={hero === undefined ? ['top', 'bottom'] : ['bottom']}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {hero}
            <View style={[styles.body, centered && styles.centered]}>
              {topControl !== undefined && <View style={styles.topControl}>{topControl}</View>}
              <View style={[styles.content, centered && styles.centeredContent]}>{children}</View>
              {footer !== undefined && <View style={styles.footer}>{footer}</View>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  body: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenGutter,
    paddingBottom: layout.bottomSafeSpacing,
  },
  centered: { justifyContent: 'center' },
  topControl: { height: layout.topControlHeight, justifyContent: 'center', marginTop: space[2] },
  content: { flexGrow: 1 },
  centeredContent: { flexGrow: 0 },
  footer: { paddingTop: layout.formToAction, gap: space[2] },
  shape: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: radius.full,
    top: -120,
    right: -96,
    opacity: 0.6,
  },
});
