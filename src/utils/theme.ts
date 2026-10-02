/**
 * Light, dark or follow the device. The choice is a per-device convenience,
 * so it lives in localStorage; index.html applies it before the app loads to
 * avoid a flash of the wrong theme.
 */
export type ThemePreference = 'system' | 'light' | 'dark'

const KEY = 'tritrain.theme'

/** The browser bar colour for each theme (the app header and status bar). */
const BAR_COLOURS = { light: '#4338ca', dark: '#111a2b' } as const

export function getTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function setTheme(theme: ThemePreference): void {
  try {
    if (theme === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // Not remembered; it still applies until the page is closed.
  }
  applyTheme(theme)
}

export function applyTheme(theme: ThemePreference = getTheme()): void {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)

  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', BAR_COLOURS[dark ? 'dark' : 'light'])
}
