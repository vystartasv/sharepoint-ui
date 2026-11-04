import { createContext, createElement, useContext, type CSSProperties, type ReactNode } from "react";

export type SharePointTheme = {
  accent: string;
  accentText: string;
  background: string;
  border: string;
  radius: string;
  surface: string;
  text: string;
  muted: string;
};

const defaults: SharePointTheme = {
  accent: "#0f6cbd",
  accentText: "#ffffff",
  background: "#f5f5f5",
  border: "#d1d1d1",
  radius: "4px",
  surface: "#ffffff",
  text: "#242424",
  muted: "#616161",
};

const sharePointVars: Partial<Record<keyof SharePointTheme, string>> = {
  accent: "--themePrimary",
  accentText: "--white",
  background: "--neutralLighterAlt",
  border: "--neutralQuaternaryAlt",
  surface: "--white",
  text: "--neutralPrimary",
  muted: "--neutralSecondary",
};

const ThemeContext = createContext<SharePointTheme>(defaults);

export function createSharePointTheme(overrides: Partial<SharePointTheme> = {}): SharePointTheme {
  const inherited: Partial<SharePointTheme> = {};
  if (typeof document !== "undefined") {
    const style = getComputedStyle(document.documentElement);
    for (const [token, variable] of Object.entries(sharePointVars) as [keyof SharePointTheme, string][]) {
      const value = style.getPropertyValue(variable).trim();
      if (value) inherited[token] = value;
    }
  }
  return { ...defaults, ...inherited, ...overrides };
}

export function SharePointThemeProvider({
  children,
  theme,
}: {
  children: ReactNode;
  theme?: Partial<SharePointTheme>;
}) {
  const value = createSharePointTheme(theme);
  const style = Object.fromEntries(
    Object.entries(theme ?? {}).map(([key, token]) => [`--spui-${key}`, token]),
  ) as CSSProperties;
  return createElement(ThemeContext.Provider, { value },
    createElement("div", { className: "spui-theme", style }, children),
  );
}

export function useSharePointTheme() {
  return useContext(ThemeContext);
}
