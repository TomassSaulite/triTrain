import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activitiesApi } from '@/api'
import type { Activity, Paginated } from '@/api/types'
import { useUnratedStore } from './unrated'

describe('unrated store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('counts recent sessions without a rating', async () => {
    vi.spyOn(activitiesApi, 'list').mockResolvedValue({
      data: [{ id: 1, feedback: null }, { id: 2, feedback: { rpe: 5 } }, { id: 3 }],
    } as unknown as Paginated<Activity>)
    const store = useUnratedStore()

    await store.refresh()

    expect(store.count).toBe(2)
  })

  it('keeps the last count when the API cannot be reached', async () => {
    const store = useUnratedStore()
    store.count = 4
    vi.spyOn(activitiesApi, 'list').mockRejectedValue(new TypeError('Failed to fetch'))

    await store.refresh()

    expect(store.count).toBe(4)
  })
})
