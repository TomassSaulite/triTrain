import { defineStore } from 'pinia'
import { ref } from 'vue'
import { activitiesApi } from '@/api'
import { addDays, today } from '@/utils/dates'

/** Sessions from this many days back count as waiting for a rating. */
export const RATE_WITHIN_DAYS = 3

/**
 * How many recent sessions have not been rated yet, for the reminder badge
 * in the navigation. Refreshed on load and whenever a rating changes.
 */
export const useUnratedStore = defineStore('unrated', () => {
  const count = ref(0)

  async function refresh(): Promise<void> {
    try {
      const recent = await activitiesApi.list({ from: addDays(today(), -(RATE_WITHIN_DAYS - 1)) })
      count.value = recent.data.filter((a) => !a.feedback).length
    } catch {
      // A reminder is not worth an error; keep the last count.
    }
  }

  return { count, refresh }
})
