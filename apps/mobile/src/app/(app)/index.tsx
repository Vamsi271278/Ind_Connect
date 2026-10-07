import { layout, space } from '@project-connect/design-tokens';
import { AppText, Button, Screen } from '@project-connect/ui';
import { StyleSheet, View } from 'react-native';

import { useAppState } from '@/app-shell/session-provider';

/** Placeholder: discovery/home arrives with later batches. */
export default function HomeScreen() {
  const { signOut } = useAppState();
  return (
    <Screen footer={<Button variant="secondary" label="Sign out" onPress={() => void signOut()} />}>
      <View style={styles.copy}>
        <AppText variant="h1">You’re in</AppText>
        <AppText tone="secondary">Home arrives in a later build stage.</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: { gap: layout.headingToSubtitle, marginTop: space[8] },
});
