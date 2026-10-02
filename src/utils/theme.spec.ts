import { beforeEach, describe, expect, it } from 'vitest'
import { applyTheme, getTheme, setTheme } from './theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.head.innerHTML = '<meta name="theme-color" content="#4338ca" />'
  })

  it('follows the device until a theme is picked', () => {
    expect(getTheme()).toBe('system')
    applyTheme()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('remembers a picked theme and stamps it on the page', () => {
    setTheme('dark')

    expect(getTheme()).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#111a2b')

    setTheme('system')
    expect(getTheme()).toBe('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})
