// Server-only engineering check: can the admin reach the API? Runs in a Server
// Component, so API_BASE_URL is never shipped to the browser and the API needs
// no CORS configuration.

export type ApiHealth =
  | { readonly state: 'healthy' }
  | { readonly state: 'not_configured' }
  | { readonly state: 'unavailable' };

const TIMEOUT_MS = 3000;

function apiBaseUrl(): URL | undefined {
  const raw = process.env.API_BASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

function isHealthyBody(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    'status' in body &&
    body.status === 'ok' &&
    'service' in body &&
    body.service === 'api'
  );
}

export async function getApiHealth(): Promise<ApiHealth> {
  const base = apiBaseUrl();
  if (!base) return { state: 'not_configured' };

  try {
    const response = await fetch(new URL('/health', base), {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return { state: 'unavailable' };
    return isHealthyBody(await response.json()) ? { state: 'healthy' } : { state: 'unavailable' };
  } catch {
    // Network failure, timeout or invalid JSON. Details are intentionally not
    // surfaced: they can include internal hostnames.
    return { state: 'unavailable' };
  }
}
