import type { User } from './types'

const TOKEN_KEY = 'tritrain.token'
const USER_KEY = 'tritrain.user'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage unavailable (private mode): the session lasts until the tab closes.
  }
}

/** The API token, kept in localStorage so a reload keeps the athlete signed in. */
export const tokenStorage = {
  get: (): string | null => read(TOKEN_KEY),
  set: (token: string): void => write(TOKEN_KEY, token),
  clear: (): void => write(TOKEN_KEY, null),
}

/** The last profile the API returned, so the installed app still opens without a connection. */
export const userStorage = {
  get(): User | null {
    try {
      return JSON.parse(read(USER_KEY) ?? 'null') as User | null
    } catch {
      return null
    }
  },
  set: (user: User): void => write(USER_KEY, JSON.stringify(user)),
  clear: (): void => write(USER_KEY, null),
}
