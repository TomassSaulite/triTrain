<script setup lang="ts">
import { computed } from 'vue'
import { calendarApi, loadApi, plansApi, suggestionsApi } from '@/api'
import { ApiError } from '@/api/client'
import type { CalendarDay, Plan, WeekProgress } from '@/api/types'
import SuggestionsCard from '@/components/SuggestionsCard.vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import LoadChart from '@/components/charts/LoadChart.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useAuthStore } from '@/stores/auth'
import { addDays, formatDate, startOfWeek, today } from '@/utils/dates'
import { formatDuration, formatPercent, formatTss } from '@/utils/format'

const auth = useAuthStore()
const todayDate = today()

/** The active plan, or null when the athlete has not built one yet. */
async function currentPlan(): Promise<Plan | null> {
  try {
    return await plansApi.current()
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

const dashboard = useAsync(async () => {
  const [plan, week, summary, series, suggestions] = await Promise.all([
    currentPlan(),
    calendarApi.range(todayDate, addDays(todayDate, 6)),
    loadApi.summary(),
    loadApi.series(addDays(todayDate, -90), todayDate),
    suggestionsApi.pending(),
  ])
  const progress: WeekProgress[] = plan ? await plansApi.progress(plan.id) : []

  return { plan, days: week.data, summary, series, suggestions, progress }
})

const todayEntry = computed<CalendarDay | undefined>(() => dashboard.data.value?.days[0])
const upcoming = computed(() => dashboard.data.value?.days.slice(1) ?? [])
const thisWeek = computed(() =>
  dashboard.data.value?.progress.find((w) => w.start_date === startOfWeek(todayDate)),
)
const race = computed(() => dashboard.data.value?.plan?.race)

function removeSuggestion(id: number): void {
  const data = dashboard.data.value
  if (data) dashboard.data.value = { ...data, suggestions: data.suggestions.filter((s) => s.id !== id) }
}

function formLabel(tsb: number): string {
  if (tsb > 15) return 'Fresh'
  if (tsb >= -10) return 'Balanced'
  if (tsb >= -30) return 'Building fatigue'
  return 'Very tired'
}
</script>

<template>
  <LoadingState :loading="dashboard.loading.value" :error="dashboard.error.value" @retry="dashboard.run">
    <div v-if="dashboard.data.value" class="space-y-6">
      <header class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-sm text-slate-500">
            {{ formatDate(todayDate, { weekday: 'long', day: 'numeric', month: 'long' }) }}
          </p>
          <h1 class="text-2xl font-semibold">Hi {{ auth.user?.name.split(' ')[0] }}</h1>
        </div>
        <p v-if="race" class="text-sm text-slate-600">
          <span class="text-2xl font-semibold text-slate-900 tabular-nums">{{ race.days_to_go }}</span>
          days to {{ race.name }}
        </p>
      </header>

      <AppAlert v-if="!dashboard.data.value.plan" tone="info">
        No plan yet.
        <RouterLink :to="{ name: 'races' }" class="font-medium underline">Add your goal race</RouterLink>
        and the coach will build one.
      </AppAlert>
      <AppAlert v-for="warning in dashboard.data.value.plan?.warnings ?? []" :key="warning" tone="warning">
        {{ warning }}
      </AppAlert>

      <SuggestionsCard :suggestions="dashboard.data.value.suggestions" @resolved="removeSuggestion" />

      <div class="grid gap-6 lg:grid-cols-3">
        <AppCard title="Today" class="lg:col-span-1">
          <div v-if="todayEntry && todayEntry.workouts.length" class="space-y-2">
            <WorkoutCard v-for="w in todayEntry.workouts" :key="w.id" :workout="w" />
          </div>
          <p v-else-if="todayEntry?.races.length" class="text-sm">
            Race day: {{ todayEntry.races[0].name }}. Good luck!
          </p>
          <p v-else class="text-sm text-slate-500">Rest day. Recovery is training too.</p>
        </AppCard>

        <AppCard title="Fitness, fatigue and form" class="lg:col-span-2">
          <dl class="mb-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <dt class="text-xs text-slate-500">Fitness</dt>
              <dd class="text-2xl font-semibold tabular-nums">
                {{ Math.round(dashboard.data.value.summary.ctl) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">Fatigue</dt>
              <dd class="text-2xl font-semibold tabular-nums">
                {{ Math.round(dashboard.data.value.summary.atl) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">Form</dt>
              <dd class="text-2xl font-semibold tabular-nums">
                {{ dashboard.data.value.summary.tsb > 0 ? '+' : ''
                }}{{ Math.round(dashboard.data.value.summary.tsb) }}
              </dd>
              <dd class="text-xs text-slate-500">{{ formLabel(dashboard.data.value.summary.tsb) }}</dd>
            </div>
          </dl>
          <LoadChart :points="dashboard.data.value.series" />
        </AppCard>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <AppCard title="Coming up" class="lg:col-span-2">
          <ol class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="day in upcoming" :key="day.date">
              <p class="mb-1 text-xs font-medium text-slate-500">{{ formatDate(day.date) }}</p>
              <div class="space-y-1.5">
                <p
                  v-for="r in day.races"
                  :key="r.id"
                  class="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900"
                >
                  {{ r.priority }} race: {{ r.name }}
                </p>
                <WorkoutCard v-for="w in day.workouts" :key="w.id" :workout="w" compact />
                <p v-if="!day.workouts.length && !day.races.length" class="text-sm text-slate-400">Rest</p>
              </div>
            </li>
          </ol>
        </AppCard>

        <AppCard title="This week">
          <template v-if="thisWeek">
            <p class="text-sm text-slate-600">
              {{ formatTss(thisWeek.actual.tss) }} of {{ formatTss(thisWeek.planned.tss) }} TSS ·
              {{ formatDuration(thisWeek.actual.duration_s) }} of
              {{ formatDuration(thisWeek.planned.duration_s) }}
            </p>
            <div
              class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              :aria-valuenow="Math.round((thisWeek.compliance ?? 0) * 100)"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Share of this week's planned load done"
            >
              <div
                class="h-full rounded-full bg-indigo-600"
                :style="{ width: formatPercent(Math.min(1, thisWeek.compliance ?? 0)) }"
              />
            </div>
            <dl class="mt-4 grid grid-cols-2 gap-2 text-sm">
              <dt class="text-slate-500">Done</dt>
              <dd class="text-right">{{ thisWeek.sessions.completed }}</dd>
              <dt class="text-slate-500">Partial</dt>
              <dd class="text-right">{{ thisWeek.sessions.partial }}</dd>
              <dt class="text-slate-500">Missed</dt>
              <dd class="text-right">{{ thisWeek.sessions.missed }}</dd>
              <dt class="text-slate-500">To go</dt>
              <dd class="text-right">{{ thisWeek.sessions.upcoming }}</dd>
            </dl>
            <p v-if="thisWeek.is_recovery" class="mt-3 text-sm text-slate-600">
              Recovery week: keep it easy.
            </p>
          </template>
          <p v-else class="text-sm text-slate-500">No plan week this week.</p>
        </AppCard>
      </div>
    </div>
  </LoadingState>
</template>
