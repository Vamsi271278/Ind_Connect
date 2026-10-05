import { layout, space } from '@project-connect/design-tokens';
import { AppText, Button, InlineMessage, Screen } from '@project-connect/ui';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useAppState } from '@/app-shell/session-provider';
import { ConnectionArtwork } from '@/features/onboarding/ConnectionArtwork';

/**
 * Onboarding continuation — a TEMPORARY holding screen until the Location
 * slice exists (B3-V1). It does not pretend Location is implemented; once it
 * is, users go straight from Gender to Location and this screen is removed.
 */
export default function SetupContinueScreen() {
  const { signOut } = useAppState();
  const { width, height } = useWindowDimensions();
  const [holding, setHolding] = useState(false);

  return (
    <Screen
      hero={
        <ConnectionArtwork
          width={width}
          height={Math.round(Math.min(Math.max(height * 0.38, 220), 380))}
        />
      }
      footer={
        <>
          <Button
            label="Continue setup"
            onPress={() => {
              setHolding(true);
            }}
          />
          <Button variant="tertiary" label="Sign out" onPress={() => void signOut()} />
        </>
      }
    >
      <View style={styles.copy}>
        <AppText variant="h1">Great start.</AppText>
        <AppText variant="bodyLarge" style={styles.strong}>
          Your profile basics are saved.
        </AppText>
        <AppText tone="secondary">
          Next, we’ll use your city to help you find relevant people, activities and events nearby.
        </AppText>
        {holding && (
          <InlineMessage
            tone="info"
            message="Location setup isn’t available in this build yet. Your progress is saved."
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: { gap: layout.headingToSubtitle, paddingTop: space[8] },
  strong: { fontWeight: '600' },
});
