import type { ReactNode } from 'react';
import { layout, space } from '@project-connect/design-tokens';
import { AppLogo, AppText, Button, LoadingIndicator, Screen } from '@project-connect/ui';
import { StyleSheet, View } from 'react-native';

import { useAppState } from '@/app-shell/session-provider';

/**
 * Bootstrap / gate states. `loading` is the A01 Splash: indigo, white mark,
 * small loader, no tagline. It shows only while bootstrap actually needs
 * time — there is no artificial minimum delay.
 */
export default function StatusScreen() {
  const { route, retry, signOut } = useAppState();

  switch (route) {
    case 'unavailable':
      return (
        <Message
          title="We couldn't connect right now"
          body="Check your connection and try again. You're still signed in."
          action={<Button label="Try again" onPress={retry} />}
        />
      );
    case 'maintenance':
      return (
        <Message
          title="We'll be back shortly"
          body="Project Connect is briefly unavailable for maintenance."
          action={<Button label="Try again" onPress={retry} />}
        />
      );
    case 'update-required':
      return (
        <Message
          title="Update required"
          body="This version of Project Connect is no longer supported. Please update the app to continue."
        />
      );
    case 'restricted':
      return (
        <Message
          title="Account unavailable"
          body="Your account can't be used right now. Account-status details arrive in a later release."
          action={<Button variant="secondary" label="Sign out" onPress={() => void signOut()} />}
        />
      );
    case 'loading':
    case 'auth':
    case 'onboarding':
    case 'app':
      // Guarded routes take over as soon as they apply.
      return <Splash />;
  }
}

function Splash() {
  return (
    <Screen background="brand" centered>
      <View style={styles.splash} accessibilityLiveRegion="polite">
        <AppLogo size={96} tone="onBrand" wordmark="below" />
        <View style={styles.loader}>
          <LoadingIndicator tone="onBrand" />
        </View>
      </View>
    </Screen>
  );
}

function Message(props: {
  readonly title: string;
  readonly body: string;
  readonly action?: ReactNode;
}) {
  return (
    <Screen centered footer={props.action}>
      <View style={styles.copy}>
        <AppText variant="h1">{props.title}</AppText>
        <AppText tone="secondary">{props.body}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  splash: { alignItems: 'center', gap: space[16] },
  loader: { height: space[10], justifyContent: 'center' },
  copy: { gap: layout.headingToSubtitle },
});
