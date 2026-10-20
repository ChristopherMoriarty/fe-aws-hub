import { useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'aws-hub-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )

  const setTheme = (next: Theme) => {
    document.documentElement.dataset.theme = next
    localStorage.setItem(STORAGE_KEY, next)
    setThemeState(next)
  }

  return { theme, setTheme }
}
