import { layout, space } from '@project-connect/design-tokens';
import {
  AppText,
  BackButton,
  Button,
  InlineMessage,
  PhoneField,
  Screen,
  toInternational,
} from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { describeAuthFailure } from '@/core/auth-messages';

import { requestCode } from './verification';

// DFW launch: +1 only. The server applies the authoritative country policy.
const CALLING_CODE = '1';
const NATIONAL_LENGTH = 10;

/**
 * Phone entry shared by A04 (sign up) and A05 (sign in). Both use the same
 * server flow; copy never reveals whether a number already has an account.
 */
export function PhoneEntry(props: {
  readonly title: string;
  readonly subtitle: string;
  readonly helper: string;
  readonly actionLabel: string;
  readonly footer?: ReactNode;
}) {
  const router = useRouter();
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string>();
  const [banner, setBanner] = useState<string>();

  const submit = async () => {
    setBusy(true);
    setFieldError(undefined);
    setBanner(undefined);
    try {
      await requestCode(toInternational(CALLING_CODE, digits));
      router.push('/verify-code');
    } catch (error) {
      const failure = describeAuthFailure(error);
      if (failure.kind === 'field') setFieldError(failure.message);
      else if (failure.kind !== 'underage') setBanner(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      decoration="teal"
      topControl={
        <BackButton
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/welcome');
          }}
        />
      }
      footer={
        <>
          <Button
            label={props.actionLabel}
            disabled={digits.length !== NATIONAL_LENGTH}
            loading={busy}
            onPress={() => void submit()}
          />
          {props.footer}
        </>
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">{props.title}</AppText>
        <AppText tone="secondary">{props.subtitle}</AppText>
      </View>
      <View style={styles.form}>
        <PhoneField
          label="Phone number"
          callingCode={CALLING_CODE}
          countryName="United States"
          value={digits}
          onChangeValue={(next) => {
            setDigits(next);
            setFieldError(undefined);
          }}
          placeholder="(555) 123-4567"
          helperText={props.helper}
          errorText={fieldError}
          autoFocus
          returnKeyType="done"
        />
        {banner !== undefined && <InlineMessage tone="error" message={banner} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  form: { marginTop: layout.subtitleToForm, gap: layout.fieldGap },
});
