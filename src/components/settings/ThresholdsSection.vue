<script setup lang="ts">
import { ref } from 'vue'
import { thresholdsApi } from '@/api'
import type { ThresholdMetric } from '@/api/types'
import ThresholdsForm from '@/components/forms/ThresholdsForm.vue'
import { emptyThresholds, parseThresholds } from '@/components/forms/thresholds'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { formatDate } from '@/utils/dates'
import { THRESHOLD_METRICS, formatThreshold, titleCase } from '@/utils/format'

const current = useAsync(() => thresholdsApi.current())
const draft = ref(emptyThresholds())
const inputErrors = ref<Record<string, string>>({})
const saved = ref(false)
const { submitting, error, submit } = useForm()

async function record(): Promise<void> {
  saved.value = false
  const { values, errors } = parseThresholds(draft.value)
  inputErrors.value = errors

  if (Object.keys(errors).length > 0 || Object.keys(values).length === 0) return

  const done = await submit(async () => {
    for (const [metric, value] of Object.entries(values)) {
      await thresholdsApi.record(metric as ThresholdMetric, value)
    }
    return true
  })

  if (done) {
    draft.value = emptyThresholds()
    saved.value = true
    await current.run()
  }
}
</script>

<template>
  <AppCard id="thresholds" title="Thresholds">
    <p class="mb-4 text-sm text-slate-600">
      Every workout is written as a share of these, so a new test updates all your upcoming sessions.
    </p>
    <LoadingState :loading="current.loading.value" :error="current.error.value" @retry="current.run">
      <dl v-if="current.data.value?.length" class="mb-5 grid gap-3 sm:grid-cols-4">
        <div
          v-for="t in current.data.value"
          :key="t.metric"
          class="rounded-md bg-slate-50 p-3 ring-1 ring-slate-200"
        >
          <dt class="text-xs text-slate-500">{{ THRESHOLD_METRICS[t.metric].label }}</dt>
          <dd class="text-lg font-semibold">{{ formatThreshold(t.metric, t.value) }}</dd>
          <dd class="text-xs text-slate-500">{{ titleCase(t.source) }} · {{ formatDate(t.tested_at) }}</dd>
        </div>
      </dl>
      <p v-else class="mb-5 text-sm text-slate-500">
        No thresholds yet; workouts show percentages until you add them.
      </p>
    </LoadingState>

    <form class="space-y-4" @submit.prevent="record">
      <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>
      <p class="text-sm font-medium text-slate-700">Record a new test</p>
      <ThresholdsForm v-model="draft" :errors="inputErrors" />
      <div class="flex items-center justify-end gap-3">
        <p v-if="saved" class="text-sm text-emerald-700" role="status">Recorded.</p>
        <AppButton type="submit" :loading="submitting">Record</AppButton>
      </div>
    </form>
  </AppCard>
</template>
