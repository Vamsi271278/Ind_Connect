import { layout, space } from '@project-connect/design-tokens';
import { AppText, Button, Screen } from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, useWindowDimensions, View } from 'react-native';

import { getInstallId } from '@/app-shell/services';
import { legalUrls } from '@/config/env';
import { registrationDraft } from '@/core/registration-draft';
import { ConnectionArtwork } from '@/features/onboarding/ConnectionArtwork';

/** A02 Welcome (V1 §12). One dominant action; no carousel. */
export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  // Hero ≈ 38–42% of the screen, bounded for very small / very tall devices.
  const heroHeight = Math.round(Math.min(Math.max(height * 0.4, 240), 400));

  return (
    <Screen
      hero={<ConnectionArtwork width={width} height={heroHeight} showBrand />}
      footer={
        <>
          <Button
            label="Get started"
            onPress={() => {
              registrationDraft.clear();
              router.push('/date-of-birth');
            }}
          />
          <View style={styles.signInRow}>
            <AppText tone="secondary">Already a member?</AppText>
            <Button
              variant="tertiary"
              label="Sign in"
              onPress={() => {
                registrationDraft.clear();
                router.push('/sign-in');
              }}
            />
          </View>
          <LegalNotice />
          {__DEV__ && <DevInstallId />}
        </>
      }
    >
      <View style={styles.copy}>
        <AppText variant="h1">Find your people, wherever you are.</AppText>
        <AppText variant="bodyLarge" tone="secondary">
          Meet people nearby for friendship, activities, community and more.
        </AppText>
      </View>
    </Screen>
  );
}

/**
 * Terms/Privacy acknowledgement (decision 2026-10-04). Display only: the
 * server records acceptance (document version + timestamp) at registration —
 * viewing this screen is never treated as acceptance. Wording pending counsel.
 */
function LegalNotice() {
  const open = (kind: 'terms' | 'privacy') => {
    const url = legalUrls[kind];
    const name = kind === 'terms' ? 'Terms of Service' : 'Privacy Policy';
    if (url === undefined) {
      Alert.alert(name, `The ${name} will be available here before launch.`);
      return;
    }
    Linking.openURL(url.toString()).catch(() => {
      Alert.alert(name, `We couldn't open the ${name}. Try again.`);
    });
  };

  return (
    <AppText variant="caption" tone="secondary" align="center" style={styles.legal}>
      By continuing, you agree to our{' '}
      <AppText
        variant="caption"
        tone="link"
        accessibilityRole="link"
        style={styles.legalLink}
        onPress={() => {
          open('terms');
        }}
      >
        Terms of Service
      </AppText>{' '}
      and acknowledge our{' '}
      <AppText
        variant="caption"
        tone="link"
        accessibilityRole="link"
        style={styles.legalLink}
        onPress={() => {
          open('privacy');
        }}
      >
        Privacy Policy
      </AppText>
      .
    </AppText>
  );
}

/**
 * Development builds only: shows the persisted install ID for the pending D11
 * Android runtime smoke test (compare across restarts / sign-out). Not a
 * secret, but never rendered in production builds.
 */
function DevInstallId() {
  const [installId, setInstallId] = useState('…');
  useEffect(() => {
    getInstallId().then(setInstallId, () => {
      setInstallId('unavailable');
    });
  }, []);
  return (
    <AppText variant="small" tone="secondary" align="center" selectable>
      [dev] installId {installId}
    </AppText>
  );
}

const styles = StyleSheet.create({
  copy: { gap: layout.headingToSubtitle, paddingTop: space[8] },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legal: { marginTop: space[2] },
  legalLink: { textDecorationLine: 'underline', fontWeight: '600' },
});
