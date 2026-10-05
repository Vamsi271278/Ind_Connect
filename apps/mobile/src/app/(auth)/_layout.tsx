import { Stack } from 'expo-router';

// Welcome is the entry point whenever the (auth) group becomes active.
export const unstable_settings = { initialRouteName: 'welcome' };

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
