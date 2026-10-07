import { minTouchTarget, radius, space } from '@project-connect/design-tokens';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText.js';
import { useTheme } from './theme.js';

export interface SelectableChipProps {
  readonly label: string;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}

/**
 * Compact multi-select chip for dense taxonomies (interests). Approved for
 * B4.2B where 30+ short options would make full-width rows unusable. Same
 * selection tokens as SelectionRow/CheckboxRow; selected is shown by border,
 * tint, weight AND a drawn check mark (never colour alone, §128). The chip
 * grows with text scaling and keeps a ≥44pt touch target.
 */
export function SelectableChip({
  label,
  selected,
  onPress,
  disabled = false,
  testID,
}: SelectableChipProps) {
  const { components } = useTheme();
  const { selectionRow, input } = components;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        {
          minHeight: minTouchTarget,
          borderWidth: selected ? input.focusBorderWidth : input.borderWidth,
          paddingHorizontal: space[4] - (selected ? 1 : 0),
          borderColor: selected ? selectionRow.selectedBorder : selectionRow.border,
          backgroundColor: selected ? selectionRow.selectedBackground : selectionRow.background,
          opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {selected && (
        // Drawn with views so it never clips at large text scales.
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.check, { borderColor: selectionRow.indicatorSelected }]}
        />
      )}
      <AppText variant={selected ? 'bodyStrong' : 'body'}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[2],
    borderRadius: radius.full,
  },
  check: {
    width: 6,
    height: 11,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    marginTop: -3,
    transform: [{ rotate: '45deg' }],
  },
});
