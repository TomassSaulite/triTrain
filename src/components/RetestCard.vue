<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ThresholdStatus } from '@/api/types'
import { THRESHOLD_METRICS } from '@/utils/format'
import { hasSeen, markSeen } from '@/utils/seen'

/**
 * Prompts a retest when a threshold is more than eight weeks old, or missing:
 * stale thresholds make every target in the plan drift. Each prompt can be
 * dismissed until the next value comes in.
 */
const props = defineProps<{ statuses: ThresholdStatus[] }>()

const dismissed = ref(new Set<string>())
const keyOf = (s: ThresholdStatus) => `retest.${s.metric}.${s.tested_at ?? 'none'}`

const prompts = computed(() =>
  props.statuses.filter(
    (s) =>
      (s.status === 'due' || (s.status === 'missing' && s.metric !== 'lthr')) &&
      !dismissed.value.has(keyOf(s)) &&
      !hasSeen(keyOf(s)),
  ),
)

function dismiss(s: ThresholdStatus): void {
  markSeen(keyOf(s))
  dismissed.value = new Set([...dismissed.value, keyOf(s)])
}

const headline = (s: ThresholdStatus) =>
  s.status === 'missing'
    ? `Add your ${THRESHOLD_METRICS[s.metric].label}`
    : `Time to retest your ${THRESHOLD_METRICS[s.metric].label}`

const reason = (s: ThresholdStatus) =>
  s.status === 'missing'
    ? 'Without it, sessions show effort percentages instead of your own targets.'
    : `It was last set ${Math.round(s.age_days! / 7)} weeks ago, so your targets may no longer match your fitness.`
</script>

<template>
  <section v-if="prompts.length" class="space-y-2" aria-label="Threshold tests">
    <article
      v-for="s in prompts"
      :key="s.metric"
      class="rounded-lg bg-white p-4 shadow-xs ring-1 ring-slate-200"
    >
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold text-slate-900">{{ headline(s) }}</h2>
          <p class="mt-0.5 text-sm text-slate-600">{{ reason(s) }}</p>
        </div>
        <button type="button" class="text-sm text-slate-500 hover:text-slate-800" @click="dismiss(s)">
          Not now
        </button>
      </div>
      <details class="mt-2 text-sm">
        <summary class="cursor-pointer font-medium text-indigo-700">How to test</summary>
        <p class="mt-1 text-slate-700">{{ s.protocol }}</p>
      </details>
      <RouterLink
        :to="{ name: 'settings', hash: '#thresholds' }"
        class="mt-2 inline-block text-sm font-medium text-indigo-700 hover:underline"
      >
        Enter the new value →
      </RouterLink>
    </article>
  </section>
</template>
