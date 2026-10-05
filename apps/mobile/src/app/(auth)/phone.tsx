import { PhoneEntry } from '@/features/auth/PhoneEntry';

/** A04 Phone (sign-up path, after A03). */
export default function PhoneScreen() {
  return (
    <PhoneEntry
      title="What’s your phone number?"
      subtitle="We’ll send a verification code to make sure it’s really you."
      helper="Standard messaging rates may apply."
      actionLabel="Send code"
    />
  );
}
