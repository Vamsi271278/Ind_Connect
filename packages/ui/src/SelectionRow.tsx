import { radius, space } from '@project-connect/design-tokens';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText.js';
import { useTheme } from './theme.js';

export interface SelectionRowProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}

/**
 * Large single-choice row (V1 §9) — used for gender now, intent later.
 * Selection is shown by border, tint, weight AND a filled indicator, never
 * colour alone (§128). Wrap a set in a View with accessibilityRole="radiogroup".
 */
export function SelectionRow({
  label,
  selected,
  onPress,
  disabled = false,
  testID,
}: SelectionRowProps) {
  const { selectionRow, input } = useTheme().components;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[
        styles.row,
        {
          minHeight: selectionRow.minHeight,
          borderRadius: selectionRow.radius,
          borderWidth: selected ? input.focusBorderWidth : input.borderWidth,
          paddingHorizontal: space[4] - (selected ? 1 : 0),
          borderColor: selected ? selectionRow.selectedBorder : selectionRow.border,
          backgroundColor: selected ? selectionRow.selectedBackground : selectionRow.background,
        },
      ]}
    >
      <AppText variant={selected ? 'bodyStrong' : 'body'} style={styles.label}>
        {label}
      </AppText>
      <View
        style={[
          styles.indicator,
          {
            width: selectionRow.indicatorSize,
            height: selectionRow.indicatorSize,
            borderColor: selected ? selectionRow.indicatorSelected : selectionRow.indicator,
          },
        ]}
      >
        {selected && (
          <View style={[styles.dot, { backgroundColor: selectionRow.indicatorSelected }]} />
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
  label: { flex: 1 },
  indicator: {
    borderWidth: 2,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: radius.full },
});
