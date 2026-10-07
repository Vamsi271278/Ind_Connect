import { layout, space } from '@project-connect/design-tokens';
import { AppText, BackButton, Button, InlineMessage, Screen, TextField } from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, type TextInput, View } from 'react-native';

import { checkDateOfBirth } from '@/core/age-gate';
import { describeAuthFailure } from '@/core/auth-messages';
import { registrationDraft } from '@/core/registration-draft';
import { register } from '@/features/auth/verification';

const digitsOnly = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);

/**
 * A03 Date of birth. Three labelled fields (no wheel-only picker). The check
 * here is UX only; the server decides eligibility at registration. The date
 * stays in memory (registrationDraft) and is never logged or tracked.
 */
export default function DateOfBirthScreen() {
  const router = useRouter();
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const dayRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string>();

  const check = checkDateOfBirth({ month, day, year }, new Date());
  const canContinue = check.kind === 'eligible' || check.kind === 'underage';
  const problem =
    check.kind === 'invalid'
      ? 'Enter a real date, for example 08 14 1994.'
      : check.kind === 'future'
        ? "Your date of birth can't be in the future."
        : undefined;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/welcome');
  };

  const toUnderage = () => {
    // No retained DOB (SFS A03): clear the draft and the inputs.
    registrationDraft.clear();
    setMonth('');
    setDay('');
    setYear('');
    router.replace('/age-requirement');
  };

  const onContinue = async () => {
    if (check.kind === 'underage') {
      toUnderage();
      return;
    }
    if (check.kind !== 'eligible') return;
    registrationDraft.setDateOfBirth(check.isoDate);

    // Sign-in path for a number without an account: the phone is already
    // verified, so create the account now. Otherwise continue to A04.
    const registrationToken = registrationDraft.getRegistrationToken();
    if (registrationToken === undefined) {
      router.push('/phone');
      return;
    }
    setBusy(true);
    setBanner(undefined);
    try {
      await register(registrationToken, check.isoDate);
      // Signed in: the root guard moves to onboarding.
    } catch (error) {
      const failure = describeAuthFailure(error);
      if (failure.kind === 'underage') toUnderage();
      else if (failure.kind === 'restart-verification') {
        registrationDraft.clear();
        setBanner(failure.message);
      } else setBanner(failure.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      decoration="indigo"
      topControl={<BackButton onPress={goBack} />}
      footer={
        <Button
          label="Continue"
          disabled={!canContinue}
          loading={busy}
          onPress={() => void onContinue()}
        />
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">What’s your date of birth?</AppText>
        <AppText tone="secondary">
          You must be 18 or older to join. Your birth date won’t appear on your profile.
        </AppText>
      </View>

      <View style={styles.form}>
        <View style={styles.row} accessibilityLabel="Date of birth">
          <View style={styles.short}>
            <TextField
              label="Month"
              placeholder="MM"
              value={month}
              keyboardType="number-pad"
              maxLength={2}
              autoFocus
              returnKeyType="next"
              accessibilityHint="Date of birth, month"
              onChangeText={(text) => {
                const next = digitsOnly(text, 2);
                setMonth(next);
                if (next.length === 2) dayRef.current?.focus();
              }}
            />
          </View>
          <View style={styles.short}>
            <TextField
              ref={dayRef}
              label="Day"
              placeholder="DD"
              value={day}
              keyboardType="number-pad"
              maxLength={2}
              returnKeyType="next"
              accessibilityHint="Date of birth, day"
              onChangeText={(text) => {
                const next = digitsOnly(text, 2);
                setDay(next);
                if (next.length === 2) yearRef.current?.focus();
              }}
            />
          </View>
          <View style={styles.long}>
            <TextField
              ref={yearRef}
              label="Year"
              placeholder="YYYY"
              value={year}
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="done"
              accessibilityHint="Date of birth, year"
              onChangeText={(text) => {
                const next = digitsOnly(text, 4);
                setYear(next);
                if (next.length === 4) Keyboard.dismiss();
              }}
            />
          </View>
        </View>
        {problem !== undefined && <InlineMessage tone="error" message={problem} />}
        {banner !== undefined && <InlineMessage tone="error" message={banner} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  form: { marginTop: layout.subtitleToForm, gap: layout.fieldGap },
  row: { flexDirection: 'row', gap: space[3] },
  short: { flex: 1 },
  long: { flex: 1.5 },
});
