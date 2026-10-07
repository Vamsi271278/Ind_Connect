import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { api, queryClient, queryKeys } from '@/app-shell/services';
import { describeAuthFailure } from '@/core/auth-messages';

/** O06 options (reference data). */
export function useLanguages() {
  return useQuery({
    queryKey: queryKeys.languages,
    queryFn: async () => (await api.listLanguages()).languages,
    staleTime: 10 * 60_000,
  });
}

/** O07 options grouped by category (reference data). */
export function useInterestCatalog() {
  return useQuery({
    queryKey: queryKeys.interestCatalog,
    queryFn: async () => (await api.listInterests()).categories,
    staleTime: 10 * 60_000,
  });
}

/**
 * Full-set save by code, then refresh the self projection (saved choices) and
 * bootstrap (onboarding step). A failed save changes nothing server-side.
 */
export function useTaxonomySave(save: (codes: readonly string[]) => Promise<unknown>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const run = async (codes: readonly string[]): Promise<boolean> => {
    setBusy(true);
    setError(undefined);
    try {
      await save(codes);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: ['bootstrap'] }),
      ]);
      return true;
    } catch (caught) {
      const failure = describeAuthFailure(caught);
      setError(
        failure.kind === 'underage'
          ? "We couldn't complete that. Please try again."
          : failure.message,
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { save: run, busy, error };
}
