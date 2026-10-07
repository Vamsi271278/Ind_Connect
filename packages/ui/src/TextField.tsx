import { space, typography } from '@project-connect/design-tokens';
import { forwardRef, type ReactNode, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from './AppText.js';
import { StatusGlyph } from './InlineMessage.js';
import { useTheme } from './theme.js';

export interface FieldChromeProps {
  /** Persistent label above the field — never placeholder-only (§50). */
  readonly label: string;
  readonly helperText?: string | undefined;
  readonly errorText?: string | undefined;
  readonly disabled?: boolean;
}

export type TextFieldProps = FieldChromeProps &
  Omit<TextInputProps, 'editable' | 'style' | 'placeholderTextColor'>;

/** Label + 56pt bordered input + helper/error line (V1 §8). */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, helperText, errorText, disabled = false, onFocus, onBlur, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <FieldFrame
      label={label}
      helperText={helperText}
      errorText={errorText}
      disabled={disabled}
      focused={focused}
    >
      {(textStyle) => (
        <TextInput
          ref={ref}
          {...inputProps}
          editable={!disabled}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          accessibilityHint={errorText ?? helperText}
          accessibilityState={{ disabled }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, textStyle]}
          placeholderTextColor={textStyle.placeholderColor}
        />
      )}
    </FieldFrame>
  );
});

interface FrameTextStyle {
  readonly color: string;
  readonly placeholderColor: string;
}

/** Shared chrome for TextField and PhoneField: label, border states, messages. */
export function FieldFrame({
  label,
  helperText,
  errorText,
  disabled = false,
  focused,
  children,
}: FieldChromeProps & {
  readonly focused: boolean;
  readonly children: (text: FrameTextStyle & { fontSize: number }) => ReactNode;
}) {
  const { input } = useTheme().components;
  const hasError = errorText !== undefined;
  const borderColor = disabled
    ? input.disabled.border
    : hasError
      ? input.borderError
      : focused
        ? input.borderFocus
        : input.border;
  const borderWidth = hasError || focused ? input.focusBorderWidth : input.borderWidth;

  return (
    <View style={styles.field}>
      <AppText variant="label" style={{ color: disabled ? input.disabled.text : input.label }}>
        {label}
      </AppText>
      <View
        style={[
          styles.box,
          {
            minHeight: input.minHeight,
            borderRadius: input.radius,
            borderColor,
            borderWidth,
            // Keep content still when the border thickens on focus/error.
            paddingHorizontal: input.paddingHorizontal - (borderWidth - input.borderWidth),
            backgroundColor: disabled ? input.disabled.background : input.background,
          },
        ]}
      >
        {children({
          color: disabled ? input.disabled.text : input.text,
          placeholderColor: input.placeholder,
          fontSize: typography.body.fontSize,
        })}
      </View>
      {hasError ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <StatusGlyph tone="error" color={input.errorText} />
          <AppText variant="caption" style={[styles.messageText, { color: input.errorText }]}>
            {errorText}
          </AppText>
        </View>
      ) : helperText !== undefined ? (
        <AppText variant="caption" style={{ color: input.helper }}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space[2], alignSelf: 'stretch' },
  box: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: space[3],
    fontSize: typography.body.fontSize,
  },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  messageText: { flex: 1 },
});
