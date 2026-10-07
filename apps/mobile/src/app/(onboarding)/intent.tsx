import type { SocialIntentCode } from '@project-connect/api-contracts';
import { layout, space } from '@project-connect/design-tokens';
import {
  AppText,
  BackButton,
  Button,
  CheckboxRow,
  InlineMessage,
  LoadingIndicator,
  Screen,
} from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import {
  canContinue,
  intentRows,
  isSocialIntent,
  savedSocialSelection,
  toggleSocial,
} from '@/core/intent-selection';
import {
  useDatingConsent,
  useIntentOptions,
  useIntentsSave,
} from '@/features/onboarding/useIntents';
import { useSelf } from '@/features/onboarding/useProfileSave';

/**
 * O04 Connection intent — multi-select, at least one. Dating looks like every
 * other option (no special colour or icon). Choosing Dating never consents by
 * itself: it opens the separate O05 opt-in; turning it off withdraws consent
 * immediately. Sub-intents are not offered here.
 */
export default function IntentScreen() {
  const router = useRouter();
  const options = useIntentOptions();
  const self = useSelf();
  const intents = useIntentsSave();
  const dating = useDatingConsent();
  // The user's edits if any, otherwise the saved social intents.
  const [edited, setEdited] = useState<ReadonlySet<SocialIntentCode>>();

  const datingEnabled = self.data?.datingEnabled ?? false;
  const selection = edited ?? savedSocialSelection(self.data?.activeIntents ?? []);
  const ready = options.data !== undefined && self.data !== undefined;
  const rows = ready
    ? intentRows({ options: options.data.options, socialSelection: selection, datingEnabled })
    : [];
  const busy = intents.busy || dating.busy;
  const error = intents.error ?? dating.error;

  const onDatingPress = async () => {
    if (!datingEnabled) {
      router.push('/dating-consent');
      return;
    }
    if (await dating.optOut()) AccessibilityInfo.announceForAccessibility('Dating turned off');
  };

  const onContinue = async () => {
    if (!canContinue(selection, datingEnabled)) return;
    if (await intents.save([...selection])) router.replace('/setup-continue');
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
          disabled={!ready || !canContinue(selection, datingEnabled) || dating.busy}
          loading={intents.busy}
          onPress={() => void onContinue()}
        />
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">What brings you to Connect?</AppText>
        <AppText tone="secondary">Choose one or more. You can change these later.</AppText>
        <AppText variant="caption" tone="secondary">
          You control which types of connections you appear in.
        </AppText>
      </View>

      <View style={styles.form}>
        {!ready && !(options.isError || self.isError) && (
          <View style={styles.status}>
            <LoadingIndicator accessibilityLabel="Loading options" />
          </View>
        )}

        {!ready && (options.isError || self.isError) && (
          <View style={styles.status}>
            <InlineMessage
              tone="error"
              message="We couldn’t load these options. Check your connection and try again."
            />
            <Button
              variant="secondary"
              label="Try again"
              loading={options.isFetching || self.isFetching}
              onPress={() => {
                void options.refetch();
                void self.refetch();
              }}
            />
          </View>
        )}

        {ready && (
          <View style={styles.options} accessibilityRole="list">
            {rows.map((row) => (
              <CheckboxRow
                key={row.code}
                label={row.label}
                description={row.description ?? undefined}
                checked={row.checked}
                disabled={busy}
                busy={row.code === 'DATING' && dating.busy}
                accessibilityHint={
                  row.code === 'DATING'
                    ? row.checked
                      ? 'Turns Dating off'
                      : 'Opens the Dating opt-in'
                    : undefined
                }
                onPress={() => {
                  intents.clearError();
                  dating.clearError();
                  if (isSocialIntent(row.code)) setEdited(toggleSocial(selection, row.code));
                  else void onDatingPress();
                }}
              />
            ))}
          </View>
        )}

        {error !== undefined && <InlineMessage tone="error" message={error} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  form: { marginTop: layout.subtitleToForm, gap: layout.fieldGap },
  status: { gap: space[3], alignItems: 'stretch', paddingVertical: space[2] },
  options: { gap: space[3] },
});
