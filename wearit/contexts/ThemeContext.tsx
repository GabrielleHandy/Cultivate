/**
 * WearIt ThemeContext
 *
 * Provides the active theme throughout the app.
 * Swap theme by calling setTheme() with any Theme-conforming object.
 *
 * Usage:
 *   const { theme, setTheme } = useTheme()
 */

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import { WearItTheme, type Theme } from '@/constants/theme'

// ─────────────────────────────────────────────
// AVAILABLE THEMES — add new themes here as they ship
// ─────────────────────────────────────────────

export const THEMES: Record<string, Theme> = {
  default: WearItTheme,
  // darkAcademia: DarkAcademiaTheme,
  // y2k: Y2KTheme,
  // cleanGirl: CleanGirlTheme,
  // disneyChannel: DisneyChannelTheme,
}

export type ThemeKey = keyof typeof THEMES

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

type ThemeContextValue = {
  theme: Theme
  themeKey: ThemeKey
  setThemeKey: (key: ThemeKey) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: WearItTheme,
  themeKey: 'default',
  setThemeKey: () => {},
})

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function WearItThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('default')

  const value = useMemo<ThemeContextValue>(() => ({
    theme: THEMES[themeKey] ?? WearItTheme,
    themeKey,
    setThemeKey,
  }), [themeKey])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useTheme() {
  return useContext(ThemeContext)
}
