import { ref, shallowRef } from 'vue'
import { ApiError } from '@/api/client'

/**
 * Runs an async loader and tracks its data, loading flag and error message.
 */
export function useAsync<T>(loader: () => Promise<T>, options: { immediate?: boolean } = {}) {
  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function run(): Promise<T | null> {
    loading.value = true
    error.value = null

    try {
      data.value = await loader()
    } catch (e) {
      error.value = errorMessage(e)
    } finally {
      loading.value = false
    }

    return data.value
  }

  if (options.immediate ?? true) {
    void run()
  }

  return { data, loading, error, run }
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError || e instanceof Error) {
    return e.message
  }

  return 'Something went wrong.'
}
