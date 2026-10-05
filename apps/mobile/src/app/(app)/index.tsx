import { useAppState } from '@/app-shell/session-provider';
import { PlaceholderButton, PlaceholderScreen } from '@/ui/placeholder';

/** Placeholder: discovery/home arrives with later batches. */
export default function HomeScreen() {
  const { signOut } = useAppState();
  return (
    <PlaceholderScreen title="You're in" body="Home arrives in a later build stage.">
      <PlaceholderButton label="Sign out" variant="secondary" onPress={() => void signOut()} />
    </PlaceholderScreen>
  );
}
