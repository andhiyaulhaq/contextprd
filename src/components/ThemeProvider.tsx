'use client';

import React, { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useSettingsStore((s) => s.theme) || 'system';

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let activeTheme = theme;
      if (activeTheme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      if (activeTheme === 'light') {
        root.classList.add('light');
      } else {
        root.classList.remove('light');
      }
    };

    applyTheme();

    // Setup listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return <>{children}</>;
};
