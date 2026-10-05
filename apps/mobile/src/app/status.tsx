import { useAppState } from '@/app-shell/session-provider';
import { PlaceholderButton, PlaceholderScreen } from '@/ui/placeholder';

/** Loading / outage / gate states. Copy is provisional (B3 owns final UX). */
export default function StatusScreen() {
  const { route, retry, signOut } = useAppState();

  switch (route) {
    case 'unavailable':
      return (
        <PlaceholderScreen
          title="We can't reach Project Connect"
          body="Check your connection and try again. You are still signed in."
        >
          <PlaceholderButton label="Try again" onPress={retry} />
        </PlaceholderScreen>
      );
    case 'maintenance':
      return (
        <PlaceholderScreen
          title="Scheduled maintenance"
          body="Project Connect is briefly unavailable. Please try again soon."
        >
          <PlaceholderButton label="Try again" onPress={retry} />
        </PlaceholderScreen>
      );
    case 'update-required':
      return (
        <PlaceholderScreen
          title="Update required"
          body="This version of Project Connect is no longer supported. Please update the app."
        />
      );
    case 'restricted':
      return (
        <PlaceholderScreen
          title="Account unavailable"
          body="Your account can't be used right now. Account-status details arrive in a later release."
        >
          <PlaceholderButton label="Sign out" variant="secondary" onPress={() => void signOut()} />
        </PlaceholderScreen>
      );
    case 'loading':
    case 'auth':
    case 'onboarding':
    case 'app':
      // Guarded routes take over as soon as they apply; show progress meanwhile.
      return <PlaceholderScreen title="Project Connect" busy />;
  }
}
