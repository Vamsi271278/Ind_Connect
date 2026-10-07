import type { DeviceContext } from '@project-connect/api-contracts';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** App version from app.json (`expo.version`). */
export const appVersion: string = Constants.expoConfig?.version ?? '0.0.0';

/**
 * Minimal device context (ADR-098: no fingerprinting). The install ID is
 * supplied by core/install-id; nothing else about the device is collected.
 */
export function deviceContext(installId: string): DeviceContext {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return { platform, appVersion, osVersion: String(Platform.Version), installId };
}
