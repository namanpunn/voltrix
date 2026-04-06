"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ThemeContext = createContext({ isDark: true, toggleTheme: () => {} });

function getInitialThemeValue() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return localStorage.getItem("smartroute-theme") !== "light";
  } catch {
    return true;
  }
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(getInitialThemeValue);

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      try { localStorage.setItem("smartroute-theme", next ? "dark" : "light"); } catch (_) {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
