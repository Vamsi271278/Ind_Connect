import {
  type ColorRoles,
  type ComponentTokens,
  colorsFor,
  componentTokens,
} from '@project-connect/design-tokens';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

export interface Theme {
  readonly scheme: 'light' | 'dark';
  readonly colors: ColorRoles;
  readonly components: ComponentTokens;
}

/** Semantic tokens for the current color scheme (no raw colors in apps/). */
export function useTheme(): Theme {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return useMemo(() => {
    const colors = colorsFor(scheme);
    return { scheme, colors, components: componentTokens(colors) };
  }, [scheme]);
}
