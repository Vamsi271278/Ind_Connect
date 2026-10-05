import { firstNameSchema } from '@project-connect/api-contracts';
import { layout, space } from '@project-connect/design-tokens';
import { AppText, BackButton, Button, InlineMessage, Screen, TextField } from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { describeNameIssue } from '@/core/auth-messages';
import { useProfileSave, useSelf } from '@/features/onboarding/useProfileSave';

/** O01 First name — first name only (last name deferred, B2-C2). */
export default function NameScreen() {
  const router = useRouter();
  const self = useSelf();
  const { save, busy, error } = useProfileSave();
  // The user's edit if any, otherwise the saved value (pre-fill when returning).
  const [edited, setName] = useState<string>();
  const [touched, setTouched] = useState(false);

  const name = edited ?? self.data?.profile.firstName ?? '';

  const parsed = firstNameSchema.safeParse(name);
  const issue = parsed.success ? undefined : parsed.error.issues[0]?.message;
  const fieldError =
    touched && issue !== undefined ? describeNameIssue(issue, 'first name') : undefined;

  const onContinue = async () => {
    setTouched(true);
    if (!parsed.success) return;
    if (await save({ firstName: parsed.data })) router.push('/gender');
  };

  return (
    <Screen
      decoration="indigo"
      topControl={
        router.canGoBack() ? (
          <BackButton
            onPress={() => {
              router.back();
            }}
          />
        ) : undefined
      }
      footer={
        <Button
          label="Continue"
          disabled={name.trim() === ''}
          loading={busy}
          onPress={() => void onContinue()}
        />
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">What should we call you?</AppText>
        <AppText tone="secondary">This is the name people will see.</AppText>
      </View>
      <View style={styles.form}>
        <TextField
          label="First name"
          value={name}
          onChangeText={setName}
          onBlur={() => {
            setTouched(true);
          }}
          autoComplete="given-name"
          textContentType="givenName"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={() => void onContinue()}
          helperText="You can change this later."
          errorText={fieldError}
          autoFocus
        />
        {error !== undefined && <InlineMessage tone="error" message={error} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  form: { marginTop: layout.subtitleToForm, gap: layout.fieldGap },
});
