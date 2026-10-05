// Public (bundled) configuration. EXPO_PUBLIC_* values are inlined into the app
// binary at build time and are readable by anyone: never put secrets here.
// The API base URL is not a secret.

function parseHttpUrl(raw: string | undefined): URL | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

// Must be referenced as a static `process.env.EXPO_PUBLIC_*` expression so Expo
// can inline it.
const rawApiBaseUrl: unknown = process.env.EXPO_PUBLIC_API_BASE_URL;

export const apiBaseUrl: URL | undefined = parseHttpUrl(
  typeof rawApiBaseUrl === 'string' ? rawApiBaseUrl : undefined,
);

// Public legal documents. Unset until legal publishes them; the Welcome links
// then explain that the documents are not available yet.
const rawTermsUrl: unknown = process.env.EXPO_PUBLIC_TERMS_URL;
const rawPrivacyUrl: unknown = process.env.EXPO_PUBLIC_PRIVACY_URL;

export const legalUrls = {
  terms: parseHttpUrl(typeof rawTermsUrl === 'string' ? rawTermsUrl : undefined),
  privacy: parseHttpUrl(typeof rawPrivacyUrl === 'string' ? rawPrivacyUrl : undefined),
};
