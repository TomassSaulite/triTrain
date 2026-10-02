const KEY = 'tritrain.token'

/** The API token, kept in localStorage so a reload keeps the athlete signed in. */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    localStorage.setItem(KEY, token)
  },
  clear(): void {
    localStorage.removeItem(KEY)
  },
}
