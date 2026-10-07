import { Redirect } from 'expo-router';

import { useAppState } from '@/app-shell/session-provider';

/**
 * Entry to onboarding: the server's `onboardingStep` (bootstrap) decides where
 * the user resumes. Progress is monotonic server-side (B2-D1).
 */
export default function ResumeOnboarding() {
  const { bootstrap } = useAppState();
  const step = bootstrap.kind === 'ready' ? bootstrap.data.account?.onboardingStep : undefined;
  switch (step) {
    case 'NAME':
    case undefined:
      return <Redirect href="/name" />;
    case 'GENDER':
      return <Redirect href="/gender" />;
    case 'LOCATION':
      return <Redirect href="/location" />;
    case 'INTENT':
      return <Redirect href="/intent" />;
    case 'LANGUAGE':
      return <Redirect href="/languages" />;
    case 'INTERESTS':
      return <Redirect href="/interests" />;
    default:
      // PHOTO and later: the holding screen until the Photo slice exists.
      return <Redirect href="/setup-continue" />;
  }
}
