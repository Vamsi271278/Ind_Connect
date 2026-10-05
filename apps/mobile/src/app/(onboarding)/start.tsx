import { useAppState } from '@/app-shell/session-provider';
import { PlaceholderButton, PlaceholderScreen } from '@/ui/placeholder';

/** Placeholder: onboarding steps (name → gender → location) arrive in B3. */
export default function OnboardingStartScreen() {
  const { signOut } = useAppState();
  return (
    <PlaceholderScreen
      title="Set up your profile"
      body="Onboarding arrives in the next build stage."
    >
      <PlaceholderButton label="Sign out" variant="secondary" onPress={() => void signOut()} />
    </PlaceholderScreen>
  );
}
