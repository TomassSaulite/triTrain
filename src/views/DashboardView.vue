<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { activitiesApi, calendarApi, loadApi, plansApi, suggestionsApi, thresholdsApi } from '@/api'
import { ApiError } from '@/api/client'
import type { Activity, CalendarDay, Plan, WeekProgress, WeeklyReview } from '@/api/types'
import CoachNotes from '@/components/CoachNotes.vue'
import SuggestionsCard from '@/components/SuggestionsCard.vue'
import TakeBreakCard from '@/components/TakeBreakCard.vue'
import WeeklyReviewCard from '@/components/WeeklyReviewCard.vue'
import RetestCard from '@/components/RetestCard.vue'
import RateRecentCard from '@/components/feel/RateRecentCard.vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import LoadChart from '@/components/charts/LoadChart.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useAuthStore } from '@/stores/auth'
import { RATE_WITHIN_DAYS } from '@/stores/unrated'
import { sessionPurpose, weekFocus } from '@/utils/coach'
import { addDays, formatDate, startOfWeek, today } from '@/utils/dates'
import { formatDuration, formatPercent, formatTss } from '@/utils/format'
import { hasSeen, markSeen, unmarkSeen } from '@/utils/seen'

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
  const [plan, week, summary, series, suggestions, recent, thresholds] = await Promise.all([
    currentPlan(),
    calendarApi.range(todayDate, addDays(todayDate, 6)),
    loadApi.summary(),
    loadApi.series(addDays(todayDate, -90), todayDate),
    suggestionsApi.pending(),
    activitiesApi.list({ from: addDays(todayDate, -(RATE_WITHIN_DAYS - 1)) }),
    thresholdsApi.status(),
  ])
  const [progress, review]: [WeekProgress[], WeeklyReview | null] = plan
    ? await Promise.all([plansApi.progress(plan.id), plansApi.weeklyReview(plan.id)])
    : [[], null]

  const unrated = recent.data.filter((a) => !a.feedback)

  return { plan, days: week.data, summary, series, suggestions, progress, review, unrated, thresholds }
})

const todayEntry = computed<CalendarDay | undefined>(() => dashboard.data.value?.days[0])
const upcoming = computed(() => dashboard.data.value?.days.slice(1) ?? [])
const thisWeek = computed(() =>
  dashboard.data.value?.progress.find((w) => w.start_date === startOfWeek(todayDate)),
)
const race = computed(() => dashboard.data.value?.plan?.race)
const focus = computed(() => weekFocus(dashboard.data.value?.progress ?? [], startOfWeek(todayDate)))

/** Last week's review shows until the athlete dismisses it, once per week. */
const review = computed(() => dashboard.data.value?.review ?? null)
const reviewKey = computed(() => (review.value ? `review.${review.value.week_start}` : ''))
const reviewDismissed = ref(false)
watch(reviewKey, (key) => (reviewDismissed.value = key !== '' && hasSeen(key)), { immediate: true })
const showReview = computed(() => review.value !== null && !reviewDismissed.value)

function dismissReview(): void {
  markSeen(reviewKey.value)
  reviewDismissed.value = true
}

function reopenReview(): void {
  unmarkSeen(reviewKey.value)
  reviewDismissed.value = false
}

function markRated(activity: Activity): void {
  const data = dashboard.data.value
  if (data) dashboard.data.value = { ...data, unrated: data.unrated.filter((a) => a.id !== activity.id) }
}

/** The plan is rebuilt in the background; look again once it has had a moment. */
const REPLAN_DELAY_MS = 3000

function refreshSoon(): void {
  setTimeout(() => void dashboard.run(), REPLAN_DELAY_MS)
}

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
          <p v-if="focus" class="mt-1 text-sm text-slate-600">
            <span class="font-medium text-slate-800 capitalize">{{ focus.phase }}</span>
            · week {{ focus.week }} of {{ focus.weeksInPhase }}. {{ focus.message }}
          </p>
        </div>
        <RouterLink
          v-if="race"
          :to="{ name: 'race-strategy', params: { id: race.id } }"
          class="group text-sm text-slate-600"
        >
          <span class="text-2xl font-semibold text-slate-900 tabular-nums">{{ race.days_to_go }}</span>
          days to {{ race.name }}
          <span class="block text-right text-xs font-medium text-indigo-600 group-hover:underline"
            >Race plan →</span
          >
        </RouterLink>
      </header>

      <AppAlert v-if="!dashboard.data.value.plan" tone="info">
        No plan yet.
        <RouterLink :to="{ name: 'races' }" class="font-medium underline">Add your goal race</RouterLink>
        and the coach will build one.
      </AppAlert>
      <WeeklyReviewCard v-if="showReview && review" :review="review" @dismiss="dismissReview" />
      <RateRecentCard :activities="dashboard.data.value.unrated" @rated="markRated" />
      <RetestCard :statuses="dashboard.data.value.thresholds" />
      <CoachNotes :notes="dashboard.data.value.plan?.warnings ?? []" />

      <SuggestionsCard :suggestions="dashboard.data.value.suggestions" @resolved="removeSuggestion" />

      <div class="grid gap-6 lg:grid-cols-3">
        <AppCard title="Today" class="lg:col-span-1">
          <ul v-if="todayEntry && todayEntry.workouts.length" class="space-y-3">
            <li v-for="w in todayEntry.workouts" :key="w.id">
              <WorkoutCard :workout="w" />
              <p class="mt-1 px-1 text-xs text-slate-500">{{ sessionPurpose(w.sport, w.kind) }}</p>
            </li>
          </ul>
          <p v-else-if="todayEntry?.races.length" class="text-sm">
            Race day: {{ todayEntry.races[0].name }}. Good luck!
          </p>
          <p v-else class="text-sm text-slate-500">Rest day. Recovery is training too.</p>
          <TakeBreakCard class="mt-4 border-t border-slate-100 pt-3" @done="refreshSoon" />
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
          </template>
          <p v-else class="text-sm text-slate-500">No plan week this week.</p>
          <button
            v-if="review && !showReview"
            type="button"
            class="mt-4 text-sm font-medium text-indigo-600 hover:underline"
            @click="reopenReview"
          >
            Read last week's review
          </button>
        </AppCard>
      </div>
    </div>
  </LoadingState>
</template>
