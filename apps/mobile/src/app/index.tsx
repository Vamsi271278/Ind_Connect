import { DarkTheme, DefaultTheme } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchApiHealth, type ApiHealth } from '@/services/api-health';

// Engineering bootstrap screen: proves the app can reach the API. Not product UI.
// Server state moves to TanStack Query when it is introduced.

type HealthState = 'checking' | ApiHealth;

const STATUS_LABEL: Record<HealthState, string> = {
  checking: 'Checking…',
  healthy: 'Healthy',
  not_configured: 'Not configured',
  unavailable: 'Unavailable',
};

export default function Index() {
  const { colors } = useColorScheme() === 'dark' ? DarkTheme : DefaultTheme;
  const [health, setHealth] = useState<HealthState>('checking');

  // Bumping the attempt re-runs the check; state is only set once it resolves.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void fetchApiHealth().then((result) => {
      if (active) setHealth(result);
    });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setHealth('checking');
    setAttempt((n) => n + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          Project Connect
        </Text>

        <View style={styles.statusRow} accessibilityLiveRegion="polite">
          {health === 'checking' && <ActivityIndicator accessibilityElementsHidden />}
          <Text style={[styles.status, { color: colors.text }]}>API: {STATUS_LABEL[health]}</Text>
        </View>

        {health === 'unavailable' && (
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={[styles.retry, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text }}>Retry</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  status: {
    fontSize: 16,
  },
  retry: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
});
