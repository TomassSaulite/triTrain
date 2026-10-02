import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth as authApi } from '@/api'
import { tokenStorage } from '@/api/token'
import type { User } from '@/api/types'
import { router } from './index'

const athlete = { id: 1, timezone: 'Europe/Riga' } as User['athlete']

describe('router guards', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    await router.replace('/login').catch(() => undefined)
  })

  it('sends signed-out visitors to login, remembering where they were going', async () => {
    await router.push('/calendar')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/calendar')
  })

  it('sends athletes without a profile to onboarding', async () => {
    tokenStorage.set('token')
    setActivePinia(createPinia())
    vi.spyOn(authApi, 'me').mockResolvedValue({ id: 1, name: 'A', email: 'a@b.c', athlete: null })

    await router.push('/plan')

    expect(router.currentRoute.value.name).toBe('onboarding')
  })

  it('lets athletes with a profile in and keeps them out of login', async () => {
    tokenStorage.set('token')
    setActivePinia(createPinia())
    vi.spyOn(authApi, 'me').mockResolvedValue({ id: 1, name: 'A', email: 'a@b.c', athlete })

    await router.push('/plan')
    expect(router.currentRoute.value.name).toBe('plan')

    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('signs out when the stored token no longer works', async () => {
    tokenStorage.set('stale')
    setActivePinia(createPinia())
    vi.spyOn(authApi, 'me').mockRejectedValue(new Error('Unauthenticated.'))

    await router.push('/plan')

    expect(router.currentRoute.value.name).toBe('login')
    expect(tokenStorage.get()).toBeNull()
  })
})
