import { Stack } from 'expo-router';

// `resume` routes to the server's current onboarding step.
export const unstable_settings = { initialRouteName: 'resume' };

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
