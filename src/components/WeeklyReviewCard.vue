<script setup lang="ts">
import { computed } from 'vue'
import type { ReviewVerdict, WeeklyReview } from '@/api/types'
import AppButton from '@/components/ui/AppButton.vue'
import { formatDate } from '@/utils/dates'
import { formatDuration, formatPercent } from '@/utils/format'

const props = defineProps<{ review: WeeklyReview }>()
defineEmits<{ dismiss: [] }>()

const VERDICTS: Record<ReviewVerdict, { label: string; classes: string }> = {
  on_track: { label: 'On track', classes: 'bg-emerald-100 text-emerald-800' },
  keys_missed: { label: 'Key session missed', classes: 'bg-amber-100 text-amber-900' },
  under: { label: 'Lighter than planned', classes: 'bg-amber-100 text-amber-900' },
  over: { label: 'More than planned', classes: 'bg-amber-100 text-amber-900' },
  rest: { label: 'Rest week', classes: 'bg-slate-100 text-slate-700' },
}

const range = computed(
  () =>
    `${formatDate(props.review.week_start, { day: 'numeric', month: 'short' })} – ${formatDate(props.review.week_end, { day: 'numeric', month: 'short' })}`,
)
/** The bar shows up to 100%; anything beyond is said in the label. */
const done = computed(() => Math.min(1, props.review.compliance ?? 0))
</script>

<template>
  <section
    class="min-w-0 rounded-lg bg-white p-4 shadow-xs ring-1 ring-slate-200 sm:p-5"
    aria-labelledby="weekly-review-title"
  >
    <header class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h2 id="weekly-review-title" class="text-base font-semibold text-slate-900">
        {{ review.finished ? 'Your week in review' : 'Your week so far' }}
      </h2>
      <span class="text-sm text-slate-500">{{ range }}</span>
      <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="VERDICTS[review.verdict].classes">
        {{ VERDICTS[review.verdict].label }}
      </span>
      <AppButton variant="ghost" size="sm" class="ml-auto" @click="$emit('dismiss')">Got it</AppButton>
    </header>

    <p class="mt-3 text-lg leading-snug text-slate-900">{{ review.headline }}</p>

    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <div v-if="review.compliance !== null">
        <p class="flex justify-between text-sm">
          <span class="text-slate-600">Planned load done</span>
          <span class="font-medium tabular-nums">{{ formatPercent(review.compliance) }}</span>
        </p>
        <div
          class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          :aria-valuenow="Math.round(review.compliance * 100)"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Share of the week's planned load done"
        >
          <div class="h-full rounded-full bg-indigo-600" :style="{ width: formatPercent(done) }" />
        </div>
        <p class="mt-1 text-xs text-slate-500">
          {{ formatDuration(review.actual.duration_s) }} of {{ formatDuration(review.planned.duration_s) }}
        </p>
      </div>
      <div v-if="review.key_sessions.planned">
        <p class="flex justify-between text-sm">
          <span class="text-slate-600">Key sessions</span>
          <span class="font-medium tabular-nums"
            >{{ review.key_sessions.done }} of {{ review.key_sessions.planned }}</span
          >
        </p>
        <ol class="mt-1.5 flex gap-1" aria-hidden="true">
          <li
            v-for="i in review.key_sessions.planned"
            :key="i"
            class="h-2 flex-1 rounded-full"
            :class="
              i <= review.key_sessions.done
                ? 'bg-indigo-600'
                : i <= review.key_sessions.done + review.key_sessions.missed.length
                  ? 'bg-rose-300'
                  : 'bg-slate-100'
            "
          />
        </ol>
      </div>
    </div>

    <ul v-if="review.notes.length" class="mt-4 space-y-1.5 text-sm text-slate-700">
      <li v-for="note in review.notes" :key="note" class="flex gap-2">
        <span class="text-indigo-400" aria-hidden="true">•</span>
        <span>{{ note }}</span>
      </li>
    </ul>

    <p v-if="review.next_week" class="mt-4 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-950">
      {{ review.next_week }}
    </p>

    <details v-if="review.coach_changes.length" class="mt-3 text-sm">
      <summary class="cursor-pointer text-slate-600 hover:text-slate-900">
        The coach adjusted your plan
        {{ review.coach_changes.length === 1 ? 'once' : `${review.coach_changes.length} times` }}
      </summary>
      <ul class="mt-2 space-y-1 border-l-2 border-slate-200 pl-3 text-slate-700">
        <li v-for="change in review.coach_changes" :key="change.version">{{ change.summary }}</li>
      </ul>
    </details>
  </section>
</template>
