import { layout, space } from '@project-connect/design-tokens';
import {
  AppText,
  BackButton,
  Button,
  InlineMessage,
  LoadingIndicator,
  Screen,
  SelectableChip,
} from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { api } from '@/app-shell/services';
import {
  canSaveInterests,
  interestCounterSpoken,
  interestCounterText,
  toggle,
} from '@/core/taxonomy-selection';
import { useSelf } from '@/features/onboarding/useProfileSave';
import { useInterestCatalog, useTaxonomySave } from '@/features/onboarding/useTaxonomy';

/**
 * O07 Interests — category sections of compact chips (approved for this dense
 * taxonomy), at least three (activation). The live counter sits by the CTA.
 * Codes are the identity sent to the server; no free-text interests.
 */
export default function InterestsScreen() {
  const router = useRouter();
  const catalog = useInterestCatalog();
  const self = useSelf();
  const { save, busy, error } = useTaxonomySave((codes) => api.updateMyInterests(codes));
  const [edited, setEdited] = useState<ReadonlySet<string>>();

  const selection = edited ?? new Set(self.data?.interests.map((i) => i.code) ?? []);
  const ready = catalog.data !== undefined && self.data !== undefined;
  const count = selection.size;

  // Announce counter changes explicitly: accessibilityLiveRegion is Android-only.
  const lastAnnounced = useRef(count);
  useEffect(() => {
    if (!ready || lastAnnounced.current === count) return;
    lastAnnounced.current = count;
    AccessibilityInfo.announceForAccessibility(interestCounterSpoken(count));
  }, [count, ready]);

  const onContinue = async () => {
    if (!canSaveInterests(selection)) return;
    if (await save([...selection])) router.replace('/setup-continue');
  };

  return (
    <Screen
      topControl={
        router.canGoBack() ? (
          <BackButton
            disabled={busy}
            onPress={() => {
              router.back();
            }}
          />
        ) : undefined
      }
      footer={
        <>
          {error !== undefined && <InlineMessage tone="error" message={error} />}
          <AppText
            tone="secondary"
            style={styles.counter}
            accessibilityLabel={interestCounterSpoken(count)}
          >
            {interestCounterText(count)}
          </AppText>
          <Button
            label="Continue"
            disabled={!ready || !canSaveInterests(selection)}
            loading={busy}
            onPress={() => void onContinue()}
          />
        </>
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">What are you into?</AppText>
        <AppText tone="secondary">
          Choose at least 3. We’ll use these to help you find people and activities you’ll enjoy.
        </AppText>
      </View>

      <View style={styles.form}>
        {!ready && !(catalog.isError || self.isError) && (
          <LoadingIndicator accessibilityLabel="Loading interests" />
        )}
        {!ready && (catalog.isError || self.isError) && (
          <View style={styles.status}>
            <InlineMessage
              tone="error"
              message="We couldn’t load interests. Check your connection and try again."
            />
            <Button
              variant="secondary"
              label="Try again"
              loading={catalog.isFetching || self.isFetching}
              onPress={() => {
                void catalog.refetch();
                void self.refetch();
              }}
            />
          </View>
        )}

        {ready &&
          catalog.data.map((category) => (
            <View key={category.code} style={styles.section}>
              <AppText variant="label" accessibilityRole="header">
                {category.label}
              </AppText>
              <View
                style={styles.chips}
                accessibilityRole="list"
                accessibilityLabel={category.label}
              >
                {category.interests.map((interest) => (
                  <SelectableChip
                    key={interest.code}
                    label={interest.label}
                    selected={selection.has(interest.code)}
                    disabled={busy}
                    onPress={() => {
                      setEdited(toggle(selection, interest.code));
                    }}
                  />
                ))}
              </View>
            </View>
          ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  form: { marginTop: layout.subtitleToForm, gap: space[6] },
  status: { gap: space[3], alignItems: 'stretch' },
  section: { gap: space[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  counter: { textAlign: 'center' },
});
