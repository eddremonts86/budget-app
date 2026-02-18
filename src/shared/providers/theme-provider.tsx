import { type ReactNode, useEffect, useState } from 'react'
import { ThemeProviderContext, type Theme } from './theme-context'

const STORAGE_KEY = 'tanstack-template-theme'

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  // Initialize with defaultTheme to ensure server/client match initially
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    // Default to a safe guess or defaultTheme logic, but consistent
    return 'light' 
  })

  // Hydrate from storage on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored) {
      setThemeState(stored)
    }
  }, [])

  // Calculate resolved theme based on current theme state
  useEffect(() => {
    if (!mounted) return

    const systemTheme = getSystemTheme()
    const effectiveTheme = theme === 'system' ? systemTheme : theme
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolvedTheme(effectiveTheme)

    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)
  }, [theme, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      const systemTheme = getSystemTheme()
      setResolvedTheme(systemTheme)
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(systemTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme)
    setThemeState(newTheme)
  }

  // Prevent rendering children until mounted to avoid hydration mismatch if children rely on theme?
  // Or just render children with default theme initially.
  // Standard pattern: render children, but theme might flash.
  // To avoid mismatch, we render. But the Provider value changes.
  // Context value change doesn't cause hydration mismatch itself, but what components render based on it might.
  
  // Since we are fixing hydration, we should just let it run.
  // But wait, if we changed `theme` state initialization to be consistent, we are good.

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
