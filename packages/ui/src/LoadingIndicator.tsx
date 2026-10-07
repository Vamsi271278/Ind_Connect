import { ActivityIndicator } from 'react-native';

import { useTheme } from './theme.js';

export interface LoadingIndicatorProps {
  readonly tone?: 'brand' | 'onBrand' | 'onPrimary';
  readonly size?: 'small' | 'large';
  readonly accessibilityLabel?: string;
}

/** Native platform spinner in a semantic colour. */
export function LoadingIndicator({
  tone = 'brand',
  size = 'small',
  accessibilityLabel = 'Loading',
}: LoadingIndicatorProps) {
  const { colors } = useTheme();
  const color = {
    brand: colors.action.primary,
    onBrand: colors.brand.onCore,
    onPrimary: colors.action.onPrimary,
  }[tone];
  return <ActivityIndicator color={color} size={size} accessibilityLabel={accessibilityLabel} />;
}
