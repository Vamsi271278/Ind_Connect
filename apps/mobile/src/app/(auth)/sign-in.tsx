import { AppText, Button } from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { registrationDraft } from '@/core/registration-draft';
import { PhoneEntry } from '@/features/auth/PhoneEntry';

/** A05 Sign in. Same verification flow as A04; no password, ever. */
export default function SignInScreen() {
  const router = useRouter();
  return (
    <PhoneEntry
      title="Welcome back"
      subtitle="Enter your phone number to sign in."
      helper="We’ll send a verification code."
      actionLabel="Continue"
      footer={
        <View style={styles.row}>
          <AppText tone="secondary">New here?</AppText>
          <Button
            variant="tertiary"
            label="Create an account"
            onPress={() => {
              registrationDraft.clear();
              router.replace('/date-of-birth');
            }}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
});
