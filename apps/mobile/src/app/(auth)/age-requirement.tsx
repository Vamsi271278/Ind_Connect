import { layout, radius, space } from '@project-connect/design-tokens';
import { AppText, Button, Screen, useTheme } from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

/**
 * A03 under-18 outcome. Calm, not an alarming red error page; account
 * creation does not continue and no date of birth is retained.
 */
export default function AgeRequirementScreen() {
  const router = useRouter();
  return (
    <Screen
      centered
      footer={
        <Button
          variant="secondary"
          label="Back to welcome"
          onPress={() => {
            router.replace('/welcome');
          }}
        />
      }
    >
      <AgeBadge />
      <View style={styles.copy}>
        <AppText variant="h1">Project Connect is for adults 18+</AppText>
        <AppText tone="secondary">
          You need to be at least 18 years old to create an account.
        </AppText>
      </View>
    </Screen>
  );
}

/** Decorative "18+" mark built from tokens; the heading carries the meaning. */
function AgeBadge() {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.art}
    >
      <View style={[styles.blob, { backgroundColor: colors.decor.indigoSoft }]} />
      <View style={[styles.halo, { backgroundColor: colors.decor.coralSoft }]}>
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.surface.primary, borderColor: colors.decor.coral },
          ]}
        >
          <AppText variant="h2" allowFontScaling={false} style={{ color: colors.decor.coral }}>
            18+
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: { gap: layout.headingToSubtitle, marginTop: space[6] },
  art: { height: 160, justifyContent: 'center' },
  blob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: radius.full,
    left: 0,
    top: 10,
  },
  halo: {
    position: 'absolute',
    left: 90,
    top: 0,
    width: 104,
    height: 104,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
