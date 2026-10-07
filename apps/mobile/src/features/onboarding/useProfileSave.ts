import type { SelfUser, UpdateProfileBody } from '@project-connect/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { api, queryClient, queryKeys } from '@/app-shell/services';
import { describeAuthFailure } from '@/core/auth-messages';

/** Current profile (for pre-filling O01/O02). Server state lives in TanStack Query. */
export function useSelf() {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => api.getMe() });
}

/**
 * PATCH /users/me/profile, then refresh the cached profile and bootstrap so
 * the central onboarding step is current. Errors become user-facing copy.
 */
export function useProfileSave() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const save = async (body: UpdateProfileBody): Promise<boolean> => {
    setBusy(true);
    setError(undefined);
    try {
      const self: SelfUser = await api.updateProfile(body);
      queryClient.setQueryData(queryKeys.me, self);
      await queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
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

  return { save, busy, error };
}
