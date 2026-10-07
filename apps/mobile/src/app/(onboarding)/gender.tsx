import {
  type GenderCode,
  genderSelfDescriptionSchema,
  type UpdateProfileBody,
} from '@project-connect/api-contracts';
import { layout, space } from '@project-connect/design-tokens';
import {
  AppText,
  BackButton,
  Button,
  InlineMessage,
  Screen,
  SelectionRow,
  TextField,
} from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { describeNameIssue } from '@/core/auth-messages';
import { useProfileSave, useSelf } from '@/features/onboarding/useProfileSave';

/** The five approved options (DATA-MODEL gender_options), in display order. */
const OPTIONS: readonly { readonly code: GenderCode; readonly label: string }[] = [
  { code: 'WOMAN', label: 'Woman' },
  { code: 'MAN', label: 'Man' },
  { code: 'NON_BINARY', label: 'Non-binary' },
  { code: 'SELF_DESCRIBE', label: 'Prefer to self-describe' },
  { code: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

/**
 * O02 Gender. Large selection rows (no icons, no per-gender colours). Gender is
 * SENSITIVE: self projection only and never sent to analytics (B2-D2).
 */
export default function GenderScreen() {
  const router = useRouter();
  const self = useSelf();
  const { save, busy, error } = useProfileSave();
  // The user's choice if any, otherwise the saved value (pre-fill when returning).
  const [chosen, setCode] = useState<GenderCode>();
  const [editedDescription, setDescription] = useState<string>();

  const saved = self.data?.profile;
  const code = chosen ?? saved?.genderCode ?? undefined;
  const description = editedDescription ?? saved?.genderSelfDescription ?? '';

  const describing = code === 'SELF_DESCRIBE';
  const trimmed = description.trim();
  const parsedDescription =
    describing && trimmed !== '' ? genderSelfDescriptionSchema.safeParse(trimmed) : undefined;
  const descriptionError =
    parsedDescription !== undefined && !parsedDescription.success
      ? describeNameIssue(parsedDescription.error.issues[0]?.message, 'description')
      : undefined;

  const onContinue = async () => {
    if (code === undefined || descriptionError !== undefined) return;
    // Self-description is optional and only sent with SELF_DESCRIBE; any
    // other choice clears it server-side.
    const body: UpdateProfileBody =
      parsedDescription?.success === true
        ? { genderCode: code, genderSelfDescription: parsedDescription.data }
        : { genderCode: code };
    if (await save(body)) router.push('/location');
  };

  return (
    <Screen
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
          disabled={code === undefined || descriptionError !== undefined}
          loading={busy}
          onPress={() => void onContinue()}
        />
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">How do you describe yourself?</AppText>
        <AppText tone="secondary">Choose what feels right for you.</AppText>
      </View>
      <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Gender">
        {OPTIONS.map((option) => (
          <SelectionRow
            key={option.code}
            label={option.label}
            selected={code === option.code}
            onPress={() => {
              setCode(option.code);
            }}
          />
        ))}
      </View>
      {describing && (
        <View style={styles.describe}>
          <TextField
            label="How do you describe yourself? (optional)"
            value={description}
            onChangeText={setDescription}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={90}
            errorText={descriptionError}
          />
        </View>
      )}
      {error !== undefined && (
        <View style={styles.describe}>
          <InlineMessage tone="error" message={error} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  options: { marginTop: space[6], gap: space[3] },
  describe: { marginTop: space[5] },
});
