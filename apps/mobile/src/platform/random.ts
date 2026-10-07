// D11: the ONLY module that imports expo-crypto. Hermes has no Web Crypto, so
// every random identifier in the app comes from the OS CSPRNG via this wrapper.
// There is deliberately no Math.random fallback.
import { randomUUID } from 'expo-crypto';

/** Per-installation identifier (UUID v4); persisted by core/install-id. */
export const generateInstallId = (): string => randomUUID();

/** One key per user submission; reused for that submission's retries. */
export const generateIdempotencyKey = (): string => randomUUID();

/** Per-request X-Correlation-ID (accepted by the API's correlation middleware). */
export const generateCorrelationId = (): string => randomUUID();
