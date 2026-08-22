'use client';

import { createContext, useContext } from 'react';
import { LIGHT_THEME } from './theme';

// Default context value matches the server-rendered state (light, no-op toggle) so
// consuming this before ThemeProvider mounts never throws.
export const ThemeModeContext = createContext({
  mode: 'light',
  tokens: LIGHT_THEME,
  toggleTheme: () => {},
});

export default function useThemeTokens() {
  return useContext(ThemeModeContext);
}
