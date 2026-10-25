'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  resetToSystem: () => void;
}
const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {}, setTheme: () => {}, resetToSystem: () => {} });
const themeEvent = 'examcraft-theme-change';
function readTheme(): Theme {
  const saved = localStorage.getItem('examcraft_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
const serverTheme = (): Theme => 'light';
function subscribeTheme(changed: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', changed);
  window.addEventListener('storage', changed);
  window.addEventListener(themeEvent, changed);
  return () => {
    media.removeEventListener('change', changed);
    window.removeEventListener('storage', changed);
    window.removeEventListener(themeEvent, changed);
  };
}
function applyTheme(theme: Theme) { document.documentElement.classList.toggle('dark', theme === 'dark'); }

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  const setTheme = (next: Theme) => {
    localStorage.setItem('examcraft_theme', next);
    applyTheme(next);
    window.dispatchEvent(new Event(themeEvent));
  };
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const resetToSystem = () => {
    localStorage.removeItem('examcraft_theme');
    applyTheme(readTheme());
    window.dispatchEvent(new Event(themeEvent));
  };
  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, resetToSystem }}>{children}</ThemeContext.Provider>;
};
export const useTheme = () => useContext(ThemeContext);
