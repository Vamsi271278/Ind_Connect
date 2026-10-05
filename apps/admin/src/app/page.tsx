import { getApiHealth, type ApiHealth } from '@/lib/api-health';

// Health must be evaluated per request, never prerendered at build time.
export const dynamic = 'force-dynamic';

const API_STATUS_LABEL: Record<ApiHealth['state'], string> = {
  healthy: 'Healthy',
  not_configured: 'Not configured',
  unavailable: 'Unavailable',
};

export default async function Home() {
  const health = await getApiHealth();

  return (
    <main>
      <h1>Project Connect Admin</h1>
      <p>
        API: <span data-api-health={health.state}>{API_STATUS_LABEL[health.state]}</span>
      </p>
    </main>
  );
}
