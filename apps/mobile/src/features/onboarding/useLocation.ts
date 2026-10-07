import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { api, queryClient, queryKeys } from '@/app-shell/services';
import { ApiResponseError } from '@/core/api-error';
import { describeAuthFailure } from '@/core/auth-messages';

/** O03 choices: the server's selectable launch cities (reference data). */
export function useCities() {
  return useQuery({
    queryKey: queryKeys.cities,
    queryFn: async () => (await api.listCities()).cities,
    staleTime: 10 * 60_000,
  });
}

/**
 * PATCH /users/me/location with the chosen city id only, then refresh
 * bootstrap so the central onboarding step (LOCATION → INTENT) is current.
 */
export function useLocationSave() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const save = async (cityId: string): Promise<boolean> => {
    setBusy(true);
    setError(undefined);
    try {
      await api.updateMyLocation({ cityId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bootstrap'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      ]);
      return true;
    } catch (caught) {
      const failure = describeAuthFailure(caught);
      if (failure.kind !== 'underage') setError(failure.message);
      // Only a withdrawn city makes the list stale. Refresh it in the
      // background: the save result must not wait on (or be blocked by) it,
      // and a network failure keeps the list the user already has.
      if (caught instanceof ApiResponseError && caught.code === 'CITY_NOT_AVAILABLE') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.cities });
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { save, busy, error };
}
