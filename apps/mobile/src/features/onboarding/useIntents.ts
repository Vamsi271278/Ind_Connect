import type { SocialIntentCode } from '@project-connect/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { api, queryClient, queryKeys } from '@/app-shell/services';
import { ApiResponseError } from '@/core/api-error';
import { describeAuthFailure } from '@/core/auth-messages';

/** O04 options (DATING only while the server's Dating kill switch is on). */
export function useIntentOptions() {
  return useQuery({ queryKey: queryKeys.intentOptions, queryFn: () => api.listIntentOptions() });
}

const messageFor = (caught: unknown): string => {
  const failure = describeAuthFailure(caught);
  return failure.kind === 'underage'
    ? "We couldn't complete that. Please try again."
    : failure.message;
};

/** Refreshes the self projection (saved choices) and bootstrap (onboarding step). */
const refreshAccount = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.me }),
    queryClient.invalidateQueries({ queryKey: ['bootstrap'] }),
  ]);

/** PUT /users/me/intents with the social intents only (DATING goes via consent). */
export function useIntentsSave() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const save = async (intents: readonly SocialIntentCode[]): Promise<boolean> => {
    setBusy(true);
    setError(undefined);
    try {
      await api.updateMyIntents({ intents: [...intents] });
      await refreshAccount();
      return true;
    } catch (caught) {
      setError(messageFor(caught));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    save,
    busy,
    error,
    clearError: () => {
      setError(undefined);
    },
  };
}

/**
 * Dating consent: opt in (PUT, affirmative, current policy version) and opt
 * out (DELETE, always allowed). The server holds consent and the DATING
 * intent together; the client only reflects `datingEnabled` from /users/me.
 */
export function useDatingConsent() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const run = async (work: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError(undefined);
    try {
      await work();
      await refreshAccount();
      return true;
    } catch (caught) {
      setError(messageFor(caught));
      // A changed policy or a switched-off feature: reload what is offered.
      if (
        caught instanceof ApiResponseError &&
        (caught.code === 'DATING_POLICY_OUTDATED' || caught.code === 'DATING_NOT_ELIGIBLE')
      ) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.intentOptions });
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    optIn: (policyVersion: string) => run(() => api.putDatingConsent(policyVersion)),
    optOut: () => run(() => api.deleteDatingConsent()),
    busy,
    error,
    clearError: () => {
      setError(undefined);
    },
  };
}
