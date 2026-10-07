import { layout, space } from '@project-connect/design-tokens';
import {
  AppText,
  BackButton,
  Button,
  CheckboxRow,
  InlineMessage,
  LoadingIndicator,
  Screen,
  TextField,
} from '@project-connect/ui';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { api } from '@/app-shell/services';
import { canSaveLanguages, filterLanguages, toggle } from '@/core/taxonomy-selection';
import { useSelf } from '@/features/onboarding/useProfileSave';
import { useLanguages, useTaxonomySave } from '@/features/onboarding/useTaxonomy';

/**
 * O06 Languages — searchable multi-select, at least one (BR-PROF-011).
 * English first, then the screen-spec order. Proficiency is not asked (V1).
 */
export default function LanguagesScreen() {
  const router = useRouter();
  const languages = useLanguages();
  const self = useSelf();
  const { save, busy, error } = useTaxonomySave((codes) => api.updateMyLanguages(codes));
  const [query, setQuery] = useState('');
  // The user's edits if any, otherwise the saved languages (pre-fill when returning).
  const [edited, setEdited] = useState<ReadonlySet<string>>();

  const selection = edited ?? new Set(self.data?.languages.map((l) => l.code) ?? []);
  const ready = languages.data !== undefined && self.data !== undefined;
  const shown = filterLanguages(languages.data ?? [], query);
  const noMatches = ready && query.trim() !== '' && shown.length === 0;

  useEffect(() => {
    if (noMatches) AccessibilityInfo.announceForAccessibility('No matching languages.');
  }, [noMatches]);

  const onContinue = async () => {
    if (!canSaveLanguages(selection)) return;
    if (await save([...selection])) router.push('/interests');
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
          <Button
            label="Continue"
            disabled={!ready || !canSaveLanguages(selection)}
            loading={busy}
            onPress={() => void onContinue()}
          />
        </>
      }
    >
      <View style={styles.heading}>
        <AppText variant="h1">Which languages do you speak?</AppText>
        <AppText tone="secondary">Choose all that apply.</AppText>
      </View>

      <View style={styles.form}>
        <TextField
          label="Search languages"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="off"
          maxLength={40}
          returnKeyType="done"
          disabled={!ready}
        />

        {!ready && !(languages.isError || self.isError) && (
          <LoadingIndicator accessibilityLabel="Loading languages" />
        )}
        {!ready && (languages.isError || self.isError) && (
          <View style={styles.status}>
            <InlineMessage
              tone="error"
              message="We couldn’t load languages. Check your connection and try again."
            />
            <Button
              variant="secondary"
              label="Try again"
              loading={languages.isFetching || self.isFetching}
              onPress={() => {
                void languages.refetch();
                void self.refetch();
              }}
            />
          </View>
        )}

        {ready && (
          <View style={styles.options} accessibilityRole="list">
            {shown.map((language) => (
              <CheckboxRow
                key={language.code}
                label={language.displayName}
                checked={selection.has(language.code)}
                disabled={busy}
                onPress={() => {
                  setEdited(toggle(selection, language.code));
                }}
              />
            ))}
          </View>
        )}
        {noMatches && <AppText tone="secondary">No matching languages.</AppText>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: layout.headingToSubtitle, marginTop: space[3] },
  form: { marginTop: layout.subtitleToForm, gap: layout.fieldGap },
  status: { gap: space[3], alignItems: 'stretch' },
  options: { gap: space[3] },
});
