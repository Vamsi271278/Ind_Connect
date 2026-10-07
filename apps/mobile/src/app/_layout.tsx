import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { AppProviders, useAppState } from '@/app-shell/session-provider';
import type { AppRoute } from '@/core/app-route';
import { useTheme } from '@project-connect/ui';

const STATUS_ROUTES: ReadonlySet<AppRoute> = new Set([
  'loading',
  'unavailable',
  'maintenance',
  'update-required',
  'restricted',
]);

/**
 * Route guards (B2.2). The ONLY routing decision is `useAppState().route`
 * (core/app-route). Each group is reachable only while its guard holds;
 * Expo Router redirects away from a group the moment its guard turns false
 * (e.g. on sign-out or session invalidation).
 */
function RootNavigator() {
  const { route } = useAppState();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={STATUS_ROUTES.has(route)}>
        <Stack.Screen name="status" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'auth'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'onboarding'}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={route === 'app'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const { scheme, colors } = useTheme();
  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.action.primary,
        background: colors.background.primary,
        card: colors.surface.primary,
        text: colors.text.primary,
        border: colors.border.default,
      },
    };
  }, [scheme, colors]);

  return (
    <AppProviders>
      <ThemeProvider value={navigationTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProviders>
  );
}
