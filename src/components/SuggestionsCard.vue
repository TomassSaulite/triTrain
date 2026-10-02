<script setup lang="ts">
import { ref } from 'vue'
import { suggestionsApi } from '@/api'
import type { ThresholdSuggestion } from '@/api/types'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { errorMessage } from '@/composables/useAsync'
import { THRESHOLD_METRICS, formatThreshold } from '@/utils/format'

/**
 * Possible new thresholds spotted in recent activities. The coach never
 * changes thresholds by itself; the athlete accepts or dismisses each one.
 */
defineProps<{ suggestions: ThresholdSuggestion[] }>()
const emit = defineEmits<{ resolved: [id: number] }>()

const busy = ref<number | null>(null)
const error = ref<string | null>(null)

async function resolve(suggestion: ThresholdSuggestion, accept: boolean): Promise<void> {
  busy.value = suggestion.id
  error.value = null

  try {
    await (accept ? suggestionsApi.accept(suggestion.id) : suggestionsApi.dismiss(suggestion.id))
    emit('resolved', suggestion.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <AppCard v-if="suggestions.length > 0" title="New thresholds spotted">
    <p v-if="error" class="mb-2 text-sm text-rose-700">{{ error }}</p>
    <ul class="divide-y divide-slate-100">
      <li v-for="s in suggestions" :key="s.id" class="py-3 first:pt-0 last:pb-0">
        <p class="text-sm font-medium">
          {{ THRESHOLD_METRICS[s.metric].label }}:
          <span v-if="s.current_value !== null" class="text-slate-500 line-through">{{
            formatThreshold(s.metric, s.current_value)
          }}</span>
          → {{ formatThreshold(s.metric, s.suggested_value) }}
        </p>
        <p class="mt-0.5 text-sm text-slate-600">{{ s.rationale }}</p>
        <div class="mt-2 flex gap-2">
          <AppButton size="sm" :loading="busy === s.id" @click="resolve(s, true)">Use it</AppButton>
          <AppButton size="sm" variant="secondary" :disabled="busy === s.id" @click="resolve(s, false)"
            >Dismiss</AppButton
          >
        </div>
      </li>
    </ul>
  </AppCard>
</template>
