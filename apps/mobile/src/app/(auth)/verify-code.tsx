import { maskPhone } from '@project-connect/api-contracts';
import { layout, space } from '@project-connect/design-tokens';
import {
  AppText,
  BackButton,
  Button,
  InlineMessage,
  OTP_LENGTH,
  OtpInput,
  Screen,
} from '@project-connect/ui';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { describeAuthFailure } from '@/core/auth-messages';
import { registrationDraft } from '@/core/registration-draft';
import { requestCode, verifyCode } from '@/features/auth/verification';

const secondsUntil = (ms: number | undefined) =>
  ms === undefined ? 0 : Math.max(0, Math.ceil((ms - Date.now()) / 1000));

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * A04B Verification code. One logical input (SMS autofill / paste), auto-
 * submit on six digits. The resend countdown is the server's real cooldown,
 * not a fake timer.
 */
export default function VerifyCodeScreen() {
  const router = useRouter();
  const phone = registrationDraft.getPhone();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string>();
  const [banner, setBanner] = useState<{ tone: 'error' | 'info'; message: string }>();
  const [secondsLeft, setSecondsLeft] = useState(() =>
    secondsUntil(registrationDraft.getResendAvailableAt()),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(secondsUntil(registrationDraft.getResendAvailableAt()));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  // Reached without a number (e.g. app reloaded mid-flow): start again.
  if (phone === undefined) return <Redirect href="/welcome" />;

  const verify = async (value: string) => {
    if (busy || value.length !== OTP_LENGTH) return;
    setBusy(true);
    setFieldError(undefined);
    setBanner(undefined);
    try {
      const outcome = await verifyCode(phone, value);
      // 'signed-in': SessionManager is authenticated and the root guard
      // moves to onboarding/app on its own.
      if (outcome === 'needs-date-of-birth') router.replace('/date-of-birth');
    } catch (error) {
      const failure = describeAuthFailure(error);
      if (failure.kind === 'underage') {
        registrationDraft.clear();
        router.replace('/age-requirement');
      } else if (failure.kind === 'field') {
        setFieldError(failure.message);
        setCode('');
      } else {
        setBanner({ tone: 'error', message: failure.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBanner(undefined);
    setFieldError(undefined);
    try {
      await requestCode(phone);
      setSecondsLeft(secondsUntil(registrationDraft.getResendAvailableAt()));
      setCode('');
      setBanner({ tone: 'info', message: 'We sent you a new code.' });
    } catch (error) {
      const failure = describeAuthFailure(error);
      if (failure.kind === 'field' || failure.kind === 'banner') {
        setBanner({ tone: 'error', message: failure.message });
      }
    }
  };

  return (
    <Screen
      decoration="coral"
      topControl={
        <BackButton
          onPress={() => {
            router.back();
          }}
        />
      }
      footer={
        <Button
          label="Verify"
          disabled={code.length !== OTP_LENGTH}
          loading={busy}
          onPress={() => void verify(code)}
        />
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">Enter the 6-digit code</AppText>
        <AppText tone="secondary">
          We sent it to{'\n'}
          <AppText variant="bodyStrong">{maskPhone(phone)}</AppText>
        </AppText>
      </View>

      <View style={styles.form}>
        <OtpInput
          value={code}
          onChangeValue={(next) => {
            setCode(next);
            setFieldError(undefined);
          }}
          onComplete={(next) => void verify(next)}
          hasError={fieldError !== undefined}
          disabled={busy}
          autoFocus
        />
        {fieldError !== undefined && <InlineMessage tone="error" message={fieldError} />}
        {banner !== undefined && <InlineMessage tone={banner.tone} message={banner.message} />}

        <View style={styles.resend} accessibilityLiveRegion="polite">
          <AppText variant="label" tone="secondary">
            Didn’t get it?
          </AppText>
          {secondsLeft > 0 ? (
            <AppText tone="secondary">Resend code in {clock(secondsLeft)}</AppText>
          ) : (
            <View style={styles.inlineAction}>
              <Button variant="tertiary" label="Resend code" onPress={() => void resend()} />
            </View>
          )}
        </View>
        <View style={styles.inlineAction}>
          <Button
            variant="tertiary"
            label="Change phone number"
            onPress={() => {
              router.back();
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  form: { marginTop: layout.subtitleToForm, gap: layout.fieldGap },
  resend: { gap: space[1], marginTop: space[2] },
  inlineAction: { alignSelf: 'flex-start', marginLeft: -space[1] },
});
