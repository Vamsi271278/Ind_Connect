import { layout, space } from '@project-connect/design-tokens';
import { AppText, Button, InlineMessage, Screen } from '@project-connect/ui';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useAppState } from '@/app-shell/session-provider';
import { ConnectionArtwork } from '@/features/onboarding/ConnectionArtwork';

/**
 * Onboarding continuation — a TEMPORARY holding screen at INTENT until the
 * B4.2 slice (Intent, Languages, Interests) exists. It does not pretend those
 * steps are implemented; once they are, Location leads straight to Intent and
 * this screen is removed.
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
          Your basics and city are saved.
        </AppText>
        <AppText tone="secondary">
          Next, you’ll choose what you’re here for, the languages you speak and your interests.
        </AppText>
        {holding && (
          <InlineMessage
            tone="info"
            message="The next steps aren’t available in this build yet. Your progress is saved."
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
