<script setup lang="ts">
import { computed, ref } from 'vue'
import { thresholdsApi } from '@/api'
import type { Threshold, ThresholdMetric } from '@/api/types'
import ThresholdHistory from '@/components/charts/ThresholdHistory.vue'
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
/** Enough history for every chart; thresholds change a handful of times a season. */
const HISTORY_LIMIT = 200
const history = useAsync(() => thresholdsApi.history(undefined, HISTORY_LIMIT))
const status = useAsync(() => thresholdsApi.status())

const statusOf = (metric: ThresholdMetric) => status.data.value?.find((s) => s.metric === metric)

const byMetric = computed(() => {
  const groups = new Map<ThresholdMetric, Threshold[]>()
  for (const t of history.data.value?.data ?? []) {
    groups.set(t.metric, [...(groups.get(t.metric) ?? []), t])
  }
  return (Object.keys(THRESHOLD_METRICS) as ThresholdMetric[])
    .filter((m) => groups.has(m))
    .map((metric) => ({ metric, history: groups.get(metric)! }))
})

/** Every chart starts at the oldest value, so they line up in time. */
const start = computed(() => (history.data.value?.data ?? []).map((t) => t.tested_at).sort()[0])

const weeks = (days: number) => Math.round(days / 7)
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
    await Promise.all([current.run(), history.run(), status.run()])
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
          <dd v-if="statusOf(t.metric)?.status === 'due'" class="mt-1.5">
            <details class="text-xs">
              <summary class="cursor-pointer font-medium text-amber-800">
                Retest due · {{ weeks(statusOf(t.metric)!.age_days!) }} weeks old
              </summary>
              <p class="mt-1 text-slate-600">{{ statusOf(t.metric)!.protocol }}</p>
            </details>
          </dd>
        </div>
      </dl>
      <p v-else class="mb-5 text-sm text-slate-500">
        No thresholds yet; workouts show percentages until you add them.
      </p>
    </LoadingState>

    <div v-if="byMetric.length" class="mb-6">
      <p class="mb-2 text-sm font-medium text-slate-700">Over time</p>
      <div class="grid gap-x-8 gap-y-5 md:grid-cols-2">
        <ThresholdHistory
          v-for="g in byMetric"
          :key="g.metric"
          :metric="g.metric"
          :history="g.history"
          :start="start"
        />
      </div>
      <p class="mt-2 text-xs text-slate-500">
        Filled dots are tests; open dots are estimates or values the coach detected.
      </p>
    </div>

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
