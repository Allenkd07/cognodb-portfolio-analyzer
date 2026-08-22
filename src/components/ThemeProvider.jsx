'use client';

import { useEffect, useState } from 'react';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import { THEMES, THEME_STORAGE_KEY } from '../lib/theme';
import { ThemeModeContext } from '../lib/useThemeTokens';

export default function ThemeProvider({ children }) {
  // Starts 'light' so server and first client render match; a persisted preference
  // is applied after mount to avoid a hydration mismatch.
  const [mode, setMode] = useState('light');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') setMode(saved);
    } catch {
      // localStorage unavailable (privacy mode etc) — fall back to light silently.
    }
  }, []);

  function toggleTheme() {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }

  const tokens = THEMES[mode];

  const antdTheme = {
    algorithm: mode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      colorPrimary: tokens.colorPrimary,
      colorInfo: tokens.colorPrimary,
      colorSuccess: tokens.colorSuccess,
      colorWarning: tokens.colorWarning,
      colorError: tokens.colorError,
      colorBgLayout: tokens.colorBgLayout,
      colorBgContainer: tokens.colorBgContainer,
      colorBorder: tokens.colorBorder,
      colorBorderSecondary: tokens.colorBorderSecondary,
      borderRadius: 8,
      fontFamily: 'var(--font-body), -apple-system, "Segoe UI", sans-serif',
    },
    components: {
      Table: {
        headerBg: tokens.colorBgLayout,
        headerColor: tokens.colorTextSecondary,
      },
    },
  };

  return (
    <ThemeModeContext.Provider value={{ mode, tokens, toggleTheme }}>
      <ConfigProvider theme={antdTheme}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </ThemeModeContext.Provider>
  );
}
