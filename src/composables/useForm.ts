import { reactive, ref } from 'vue'
import { ApiError } from '@/api/client'
import { errorMessage } from './useAsync'

/**
 * Submits a form and keeps the API's validation errors by field.
 */
export function useForm() {
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const fieldErrors = reactive<Record<string, string | undefined>>({})

  async function submit<T>(action: () => Promise<T>): Promise<T | undefined> {
    submitting.value = true
    error.value = null

    for (const key of Object.keys(fieldErrors)) {
      delete fieldErrors[key]
    }

    try {
      return await action()
    } catch (e) {
      if (e instanceof ApiError && e.isValidation) {
        for (const [field, messages] of Object.entries(e.errors)) {
          fieldErrors[field] = messages[0]
        }
      }

      error.value = errorMessage(e)

      return undefined
    } finally {
      submitting.value = false
    }
  }

  return { submitting, error, fieldErrors, submit }
}
