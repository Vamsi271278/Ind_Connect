import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { getInstallId } from '@/app-shell/services';
import { PlaceholderScreen } from '@/ui/placeholder';
import { useTheme } from '@/ui/theme';
import { typography } from '@project-connect/design-tokens';

/** Placeholder: phone sign-in screens arrive in B3. */
export default function WelcomeScreen() {
  return (
    <PlaceholderScreen title="Welcome" body="Sign-in arrives in the next build stage.">
      {__DEV__ && <DevInstallId />}
    </PlaceholderScreen>
  );
}

/**
 * Development builds only: shows the persisted install ID so the D11
 * persistence smoke test can compare it across restarts. Not a secret, but
 * never rendered in production builds.
 */
function DevInstallId() {
  const { colors } = useTheme();
  const [installId, setInstallId] = useState('…');
  useEffect(() => {
    getInstallId().then(setInstallId, () => {
      setInstallId('unavailable');
    });
  }, []);
  return (
    <Text selectable style={[typography.caption, { color: colors.text.tertiary }]}>
      [dev] installId {installId}
    </Text>
  );
}
