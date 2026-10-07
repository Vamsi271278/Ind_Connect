import { space, typography } from '@project-connect/design-tokens';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from './AppText.js';
import { OTP_LENGTH, sanitizeOtp } from './input-format.js';
import { useTheme } from './theme.js';

export interface OtpInputProps {
  readonly value: string;
  readonly onChangeValue: (code: string) => void;
  readonly onComplete?: (code: string) => void;
  readonly hasError?: boolean;
  readonly disabled?: boolean;
  readonly autoFocus?: boolean;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}

export interface OtpInputHandle {
  focus: () => void;
  clear: () => void;
}

/**
 * ONE logical TextInput drawn as six slots (V1 §12 A04B): SMS autofill
 * (oneTimeCode / sms-otp), paste, screen readers and keyboard handling all
 * work as for a single field. Slots are decorative and hidden from a11y.
 */
export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  {
    value,
    onChangeValue,
    onComplete,
    hasError = false,
    disabled = false,
    autoFocus = false,
    accessibilityLabel = 'Verification code, 6 digits',
    testID,
  },
  ref,
) {
  const { colors, components } = useTheme();
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    clear: () => {
      onChangeValue('');
    },
  }));

  const slots = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '');
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <Pressable
      accessible={false}
      onPress={() => input.current?.focus()}
      disabled={disabled}
      style={styles.row}
    >
      {slots.map((digit, index) => {
        const isActive = focused && index === activeIndex && value.length < OTP_LENGTH;
        const borderColor = disabled
          ? components.input.disabled.border
          : hasError
            ? components.input.borderError
            : isActive
              ? components.input.borderFocus
              : components.input.border;
        const thick = hasError || isActive;
        return (
          <View
            // Slot positions are fixed; the index is the identity.
            key={index}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.slot,
              {
                width: components.otpSlot.width,
                minHeight: components.otpSlot.height,
                borderRadius: components.otpSlot.radius,
                borderColor,
                borderWidth: thick
                  ? components.input.focusBorderWidth
                  : components.input.borderWidth,
                backgroundColor: disabled
                  ? components.input.disabled.background
                  : components.input.background,
              },
            ]}
          >
            {digit !== '' ? (
              <AppText
                variant="h2"
                style={{ color: disabled ? colors.text.disabled : colors.text.primary }}
              >
                {digit}
              </AppText>
            ) : isActive ? (
              <View style={[styles.caret, { backgroundColor: colors.action.primary }]} />
            ) : null}
          </View>
        );
      })}
      <TextInput
        ref={input}
        testID={testID}
        value={value}
        onChangeText={(text) => {
          const code = sanitizeOtp(text);
          onChangeValue(code);
          if (code.length === OTP_LENGTH) onComplete?.(code);
        }}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_LENGTH}
        caretHidden
        contextMenuHidden={false}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[2],
    alignSelf: 'stretch',
  },
  slot: { alignItems: 'center', justifyContent: 'center' },
  caret: { width: 2, height: typography.h2.lineHeight - 4 },
  // Covers the slots so taps and long-press paste reach the real field.
  hiddenInput: { ...StyleSheet.absoluteFill, opacity: 0.015, color: 'transparent' },
});
