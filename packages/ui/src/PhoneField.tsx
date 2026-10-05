import { space, typography } from '@project-connect/design-tokens';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { AppText } from './AppText.js';
import { Chevron } from './BackButton.js';
import { formatNationalNumber, phoneDigits } from './input-format.js';
import { type FieldChromeProps, FieldFrame } from './TextField.js';
import { useTheme } from './theme.js';

export interface PhoneFieldProps
  extends
    FieldChromeProps,
    Pick<TextInputProps, 'onSubmitEditing' | 'returnKeyType' | 'autoFocus' | 'testID'> {
  /** Calling code without '+', e.g. "1". */
  readonly callingCode: string;
  /** Spoken country name for the prefix control, e.g. "United States". */
  readonly countryName: string;
  /** National digits only. */
  readonly value: string;
  readonly onChangeValue: (digits: string) => void;
  /** Omit while only one country is offered; the prefix is then static. */
  readonly onPressCountry?: () => void;
  readonly placeholder?: string;
}

/** Country prefix + national number in one field group (V1 §12 A04). */
export const PhoneField = forwardRef<TextInput, PhoneFieldProps>(function PhoneField(
  {
    label,
    helperText,
    errorText,
    disabled = false,
    callingCode,
    countryName,
    value,
    onChangeValue,
    onPressCountry,
    placeholder,
    ...inputProps
  },
  ref,
) {
  const { colors, components } = useTheme();
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
        <>
          <Pressable
            accessibilityRole={onPressCountry === undefined ? 'text' : 'button'}
            accessibilityLabel={`Country code plus ${callingCode}, ${countryName}`}
            accessibilityHint={onPressCountry === undefined ? undefined : 'Changes the country'}
            disabled={disabled || onPressCountry === undefined}
            onPress={onPressCountry}
            style={[styles.prefix, { borderRightColor: components.input.divider }]}
          >
            <AppText
              variant="bodyStrong"
              style={{ color: textStyle.color }}
            >{`+${callingCode}`}</AppText>
            {onPressCountry !== undefined && (
              <Chevron direction="down" color={colors.text.secondary} size={8} />
            )}
          </Pressable>
          <TextInput
            ref={ref}
            {...inputProps}
            value={formatNationalNumber(callingCode, value)}
            onChangeText={(text) => {
              onChangeValue(phoneDigits(text));
            }}
            editable={!disabled}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel-national"
            accessibilityLabel={label}
            accessibilityHint={errorText ?? helperText}
            placeholder={placeholder}
            placeholderTextColor={textStyle.placeholderColor}
            onFocus={() => {
              setFocused(true);
            }}
            onBlur={() => {
              setFocused(false);
            }}
            style={[styles.input, { color: textStyle.color }]}
          />
        </>
      )}
    </FieldFrame>
  );
});

const styles = StyleSheet.create({
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    alignSelf: 'stretch',
    paddingRight: space[3],
    marginRight: space[3],
    borderRightWidth: 1,
    minWidth: 44,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    paddingVertical: space[3],
    fontSize: typography.body.fontSize,
  },
});
