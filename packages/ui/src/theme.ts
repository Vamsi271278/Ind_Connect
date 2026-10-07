import {
  type ColorRoles,
  type ColorScheme,
  type ComponentTokens,
  colorsFor,
  componentTokens,
} from '@project-connect/design-tokens';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

export interface Theme {
  readonly scheme: ColorScheme;
  readonly colors: ColorRoles;
  readonly components: ComponentTokens;
}

/** Semantic + component tokens for the current colour scheme. */
export function useTheme(): Theme {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return useMemo(() => {
    const colors = colorsFor(scheme);
    return { scheme, colors, components: componentTokens(colors) };
  }, [scheme]);
}
