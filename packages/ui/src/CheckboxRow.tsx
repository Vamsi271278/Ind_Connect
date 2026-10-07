import { radius, space } from '@project-connect/design-tokens';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText.js';
import { useTheme } from './theme.js';

export interface CheckboxRowProps {
  readonly label: string;
  readonly description?: string | undefined;
  readonly checked: boolean;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  /** A request for this row is in flight (announced as busy). */
  readonly busy?: boolean;
  readonly accessibilityHint?: string | undefined;
  readonly testID?: string;
}

/**
 * Large multi-choice row (V1 §9): the multi-select sibling of SelectionRow,
 * with the same tokens. Checked state is shown by border, tint, weight AND a
 * check mark in a square box, never colour alone (§128).
 */
export function CheckboxRow({
  label,
  description,
  checked,
  onPress,
  disabled = false,
  busy = false,
  accessibilityHint,
  testID,
}: CheckboxRowProps) {
  const { components, colors } = useTheme();
  const { selectionRow, input } = components;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={description === undefined ? label : `${label}. ${description}`}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked, disabled, busy }}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        styles.row,
        {
          minHeight: selectionRow.minHeight,
          borderRadius: selectionRow.radius,
          borderWidth: checked ? input.focusBorderWidth : input.borderWidth,
          paddingHorizontal: space[4] - (checked ? 1 : 0),
          borderColor: checked ? selectionRow.selectedBorder : selectionRow.border,
          backgroundColor: checked ? selectionRow.selectedBackground : selectionRow.background,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.text}>
        <AppText variant={checked ? 'bodyStrong' : 'body'}>{label}</AppText>
        {description !== undefined && (
          <AppText variant="caption" tone="secondary">
            {description}
          </AppText>
        )}
      </View>
      <View
        style={[
          styles.box,
          {
            width: selectionRow.indicatorSize,
            height: selectionRow.indicatorSize,
            borderColor: checked ? selectionRow.indicatorSelected : selectionRow.indicator,
            backgroundColor: checked ? selectionRow.indicatorSelected : 'transparent',
          },
        ]}
      >
        {checked && (
          // Drawn with views (no glyph or icon font), so it never clips at any
          // text scale. The box is filled with action.primary, so the mark uses
          // its contrast-tested pair, action.onPrimary.
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.check, { borderColor: colors.action.onPrimary }]}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    alignSelf: 'stretch',
  },
  text: { flex: 1, gap: space[1] },
  box: {
    borderWidth: 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 6,
    height: 11,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    marginTop: -2,
    transform: [{ rotate: '45deg' }],
  },
});
