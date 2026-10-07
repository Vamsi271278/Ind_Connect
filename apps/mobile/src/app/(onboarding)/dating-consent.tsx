import { layout, space } from '@project-connect/design-tokens';
import {
  AppText,
  BackButton,
  Button,
  InlineMessage,
  LoadingIndicator,
  Screen,
} from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useDatingConsent, useIntentOptions } from '@/features/onboarding/useIntents';

/**
 * O05 Dating opt-in — a separate, deliberate confirmation (B4.2A: a button
 * rather than a checkbox). Opting in is affirmative consent to Dating
 * discovery for the policy version the server is serving; it is not consent
 * to messages, meetups or sexual activity. "Not now" changes nothing.
 */
export default function DatingConsentScreen() {
  const router = useRouter();
  const options = useIntentOptions();
  const { optIn, busy, error } = useDatingConsent();
  const policyVersion = options.data?.dating?.policyVersion;

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/intent');
  };

  const onOptIn = async () => {
    if (policyVersion === undefined) return;
    if (await optIn(policyVersion)) close();
  };

  return (
    <Screen
      topControl={<BackButton onPress={close} disabled={busy} />}
      footer={
        <>
          <Button
            label="Opt in to dating"
            disabled={policyVersion === undefined}
            loading={busy}
            onPress={() => void onOptIn()}
          />
          <Button variant="tertiary" label="Not now" disabled={busy} onPress={close} />
        </>
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">Dating is optional</AppText>
        <AppText tone="secondary">Dating is a separate, opt-in part of Connect.</AppText>
      </View>
      <View style={styles.body}>
        <AppText>Only people who also opt in can appear in dating discovery.</AppText>
        <AppText>
          Choosing dating does not imply consent to messages, meetups or sexual activity.
        </AppText>
        <AppText tone="secondary">You can turn dating off at any time.</AppText>
        {options.isPending && <LoadingIndicator accessibilityLabel="Loading" />}
        {options.isError && options.data === undefined && (
          <View style={styles.status}>
            <InlineMessage
              tone="error"
              message="We couldn’t load this. Check your connection and try again."
            />
            <Button
              variant="secondary"
              label="Try again"
              loading={options.isFetching}
              onPress={() => void options.refetch()}
            />
          </View>
        )}
        {options.isSuccess && policyVersion === undefined && (
          <InlineMessage tone="info" message="Dating isn’t available right now." />
        )}
        {error !== undefined && <InlineMessage tone="error" message={error} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  body: { marginTop: layout.subtitleToForm, gap: space[4] },
  status: { gap: space[3], alignItems: 'stretch' },
});
