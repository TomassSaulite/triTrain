import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { auth as authApi } from '@/api'
import { ApiError } from '@/api/client'
import { tokenStorage, userStorage } from '@/api/token'
import type { Athlete, AuthResponse, User } from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(tokenStorage.get())
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => token.value !== null)
  const athlete = computed(() => user.value?.athlete ?? null)

  function setUser(value: User): void {
    user.value = value
    userStorage.set(value)
  }

  function start(response: AuthResponse): void {
    tokenStorage.set(response.token)
    token.value = response.token
    setUser(response.user)
  }

  async function login(email: string, password: string): Promise<void> {
    start(await authApi.login(email, password))
  }

  async function register(input: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }) {
    start(await authApi.register(input))
  }

  /**
   * Loads the signed-in user once per page load. Without a connection the last
   * known profile is used, so the installed app opens offline; only a rejected
   * token (401) is an error.
   */
  async function ensureUser(): Promise<void> {
    if (!token.value || user.value) return

    try {
      setUser(await authApi.me())
    } catch (e) {
      const cached = userStorage.get()
      if ((e instanceof ApiError && e.status === 401) || !cached) throw e
      user.value = cached
    }
  }

  function setAthlete(value: Athlete): void {
    if (user.value) {
      setUser({ ...user.value, athlete: value })
    }
  }

  /** Forgets the session locally; the server token is revoked when still valid. */
  async function logout(revoke = true): Promise<void> {
    if (revoke && token.value) {
      await authApi.logout().catch(() => undefined)
    }

    tokenStorage.clear()
    userStorage.clear()
    token.value = null
    user.value = null
  }

  return { token, user, athlete, isAuthenticated, login, register, ensureUser, setAthlete, logout }
})
