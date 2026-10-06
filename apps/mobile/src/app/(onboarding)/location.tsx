import { layout, space } from '@project-connect/design-tokens';
import {
  AppText,
  BackButton,
  Button,
  InlineMessage,
  LoadingIndicator,
  Screen,
  SelectionRow,
  TextField,
} from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { cityLabel, filterCities } from '@/core/city-search';
import { useCities, useLocationSave } from '@/features/onboarding/useLocation';

/**
 * O03 Location — manual city choice only (B4.1-D2): no GPS, no permission
 * prompt, no map, no neighborhood. Only server-listed launch cities can be
 * chosen; there is no "Other" or free-text city. The server derives metro and
 * country and decides whether the step completes.
 */
export default function LocationScreen() {
  const router = useRouter();
  const cities = useCities();
  const { save, busy, error } = useLocationSave();
  const [query, setQuery] = useState('');
  const [cityId, setCityId] = useState<string>();

  // A failed background refetch keeps the last good list (TanStack retains
  // data), so the list — and any selection — stays visible and usable.
  const loaded = cities.data !== undefined;
  const all = cities.data ?? [];
  const searching = query.trim() !== '';
  const matches = filterCities(all, query);
  // Only a city still in the server list counts as chosen (a refetch may have
  // withdrawn it), and the chosen row stays visible while searching.
  const selected = all.find((city) => city.id === cityId);
  const shown =
    selected !== undefined && !matches.includes(selected) ? [selected, ...matches] : matches;
  const noMatches = loaded && searching && matches.length === 0;

  useEffect(() => {
    if (noMatches) AccessibilityInfo.announceForAccessibility('No matching cities.');
  }, [noMatches]);

  const onContinue = async () => {
    if (selected === undefined) return;
    if (await save(selected.id)) router.replace('/setup-continue');
  };

  return (
    <Screen
      topControl={
        router.canGoBack() ? (
          <BackButton
            onPress={() => {
              router.back();
            }}
          />
        ) : undefined
      }
      footer={
        <Button
          label="Continue"
          disabled={selected === undefined}
          loading={busy}
          onPress={() => void onContinue()}
        />
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">Where are you based?</AppText>
        <AppText tone="secondary">
          We’ll use your city to help you find people, activities and events nearby.
        </AppText>
      </View>

      <View style={styles.form}>
        <TextField
          label="City"
          placeholder="Search your city"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="off"
          maxLength={60}
          returnKeyType="done"
          disabled={!loaded}
        />

        {cities.isPending && (
          <View style={styles.status}>
            <LoadingIndicator accessibilityLabel="Loading cities" />
          </View>
        )}

        {cities.isError && !loaded && (
          <View style={styles.status}>
            <InlineMessage
              tone="error"
              message="We couldn’t load cities. Check your connection and try again."
            />
            <Button
              variant="secondary"
              label="Try again"
              loading={cities.isFetching}
              onPress={() => void cities.refetch()}
            />
          </View>
        )}

        {loaded && (
          <View style={styles.list}>
            {!searching && (
              <AppText variant="label" accessibilityRole="header">
                Suggested
              </AppText>
            )}
            {shown.length > 0 && (
              <View
                style={styles.options}
                accessibilityRole="radiogroup"
                accessibilityLabel={searching ? 'Matching cities' : 'Suggested cities'}
              >
                {shown.map((city) => (
                  <SelectionRow
                    key={city.id}
                    label={cityLabel(city)}
                    selected={selected?.id === city.id}
                    onPress={() => {
                      setCityId(city.id);
                    }}
                  />
                ))}
              </View>
            )}
            {noMatches && <AppText tone="secondary">No matching cities.</AppText>}
            <View style={styles.note}>
              <AppText variant="bodyStrong">Can’t find your city?</AppText>
              <AppText tone="secondary">
                We’re starting in Dallas–Fort Worth and expanding soon.
              </AppText>
            </View>
          </View>
        )}

        <AppText variant="caption" tone="secondary">
          Your exact location is never shown to other members.
        </AppText>

        {error !== undefined && <InlineMessage tone="error" message={error} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  form: { marginTop: layout.subtitleToForm, gap: layout.fieldGap },
  status: { gap: space[3], alignItems: 'stretch', paddingVertical: space[2] },
  list: { gap: space[3] },
  options: { gap: space[3] },
  note: { gap: space[1], marginTop: space[2] },
});
