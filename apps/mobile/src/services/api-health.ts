import { apiBaseUrl } from '@/config/env';

export type ApiHealth = 'healthy' | 'not_configured' | 'unavailable';

const TIMEOUT_MS = 5000;

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

export async function fetchApiHealth(): Promise<ApiHealth> {
  if (!apiBaseUrl) return 'not_configured';

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(new URL('/health', apiBaseUrl).toString(), {
      signal: controller.signal,
    });
    if (!response.ok) return 'unavailable';
    return isHealthyBody(await response.json()) ? 'healthy' : 'unavailable';
  } catch {
    // Network failure, timeout or invalid JSON.
    return 'unavailable';
  } finally {
    clearTimeout(timeout);
  }
}
