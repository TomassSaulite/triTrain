<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { calendarApi } from '@/api'
import type { CalendarDay } from '@/api/types'
import SportBadge from '@/components/SportBadge.vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { WEEKDAYS, addDays, formatDate, parseDate, startOfWeek, today } from '@/utils/dates'
import { formatDuration, formatTss } from '@/utils/format'

const route = useRoute()
const router = useRouter()

/** The Monday shown first, kept in the URL so the view survives reloads and back. */
const start = computed(() => startOfWeek(typeof route.query.week === 'string' ? route.query.week : today()))
const weeks = computed(() => (route.query.view === 'month' ? 4 : 1))
const end = computed(() => addDays(start.value, weeks.value * 7 - 1))

const calendar = useAsync(() => calendarApi.range(start.value, end.value))
watch([start, weeks], () => calendar.run())

function go(params: { week?: string; view?: string }): void {
  void router.replace({ query: { ...route.query, ...params } })
}

const rows = computed<CalendarDay[][]>(() => {
  const days = calendar.data.value?.data ?? []
  return Array.from({ length: Math.ceil(days.length / 7) }, (_, i) => days.slice(i * 7, i * 7 + 7))
})

const totals = computed(() => {
  const days = calendar.data.value?.data ?? []
  const workouts = days.flatMap((d) => d.workouts).filter((w) => w.status !== 'dropped')
  const activities = days.flatMap((d) => d.activities)

  return {
    plannedTss: workouts.reduce((sum, w) => sum + w.target_tss, 0),
    plannedTime: workouts.reduce((sum, w) => sum + w.target_duration_s, 0),
    doneTss: activities.reduce((sum, a) => sum + (a.tss ?? 0), 0),
    doneTime: activities.reduce((sum, a) => sum + a.duration_s, 0),
  }
})

const title = computed(() => {
  const from = parseDate(start.value)
  const to = parseDate(end.value)
  const sameMonth = from.getMonth() === to.getMonth()

  return `${from.toLocaleDateString(undefined, { day: 'numeric', ...(sameMonth ? {} : { month: 'short' }) })} – ${to.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
})

/** Activities the coach could not match to a planned session. */
const extras = (day: CalendarDay) => day.activities.filter((a) => !a.planned_workout_id)
</script>

<template>
  <div class="space-y-4">
    <header class="flex flex-wrap items-center gap-3">
      <h1 class="text-xl font-semibold">{{ title }}</h1>
      <div class="ml-auto flex items-center gap-2">
        <div class="flex rounded-md ring-1 ring-slate-300" role="group" aria-label="View">
          <button
            v-for="option in [
              { value: 'week', label: 'Week' },
              { value: 'month', label: '4 weeks' },
            ]"
            :key="option.value"
            type="button"
            class="px-3 py-1.5 text-sm first:rounded-l-md last:rounded-r-md"
            :class="
              (weeks === 4) === (option.value === 'month')
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700'
            "
            :aria-pressed="(weeks === 4) === (option.value === 'month')"
            @click="go({ view: option.value })"
          >
            {{ option.label }}
          </button>
        </div>
        <AppButton
          variant="secondary"
          size="sm"
          aria-label="Previous"
          @click="go({ week: addDays(start, -7 * weeks) })"
          >←</AppButton
        >
        <AppButton variant="secondary" size="sm" @click="go({ week: today() })">Today</AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          aria-label="Next"
          @click="go({ week: addDays(start, 7 * weeks) })"
          >→</AppButton
        >
      </div>
    </header>

    <p class="text-sm text-slate-600">
      Planned {{ formatTss(totals.plannedTss) }} TSS · {{ formatDuration(totals.plannedTime) }} — done
      {{ formatTss(totals.doneTss) }} TSS · {{ formatDuration(totals.doneTime) }}
    </p>

    <LoadingState
      :loading="calendar.loading.value && !calendar.data.value"
      :error="calendar.error.value"
      @retry="calendar.run"
    >
      <div class="overflow-x-auto">
        <div class="grid min-w-[56rem] grid-cols-7 gap-2" :class="{ 'opacity-60': calendar.loading.value }">
          <p v-for="day in WEEKDAYS" :key="day.value" class="px-1 text-xs font-medium text-slate-500">
            {{ day.short }}
          </p>
          <template v-for="(row, r) in rows" :key="r">
            <section
              v-for="day in row"
              :key="day.date"
              class="min-h-32 rounded-lg p-2"
              :class="day.date === today() ? 'bg-indigo-50 ring-1 ring-indigo-300' : 'bg-slate-100/70'"
              :aria-label="formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' })"
            >
              <p
                class="mb-1.5 text-xs font-medium"
                :class="day.date === today() ? 'text-indigo-700' : 'text-slate-500'"
              >
                {{ formatDate(day.date, { day: 'numeric', month: 'short' }) }}
              </p>
              <div class="space-y-1.5">
                <p
                  v-for="race in day.races"
                  :key="race.id"
                  class="rounded-md bg-amber-100 px-2 py-1.5 text-xs font-semibold text-amber-900"
                >
                  {{ race.priority }} race · {{ race.name }}
                </p>
                <WorkoutCard v-for="w in day.workouts" :key="w.id" :workout="w" compact />
                <div
                  v-for="a in extras(day)"
                  :key="a.id"
                  class="rounded-md bg-white px-2 py-1.5 text-xs ring-1 ring-dashed ring-slate-300"
                >
                  <SportBadge :sport="a.sport" />
                  <p class="mt-1 text-slate-700">
                    {{ a.name ?? 'Extra session' }} · {{ formatDuration(a.duration_s) }} ·
                    {{ formatTss(a.tss) }} TSS
                  </p>
                </div>
              </div>
            </section>
          </template>
        </div>
      </div>
    </LoadingState>
  </div>
</template>
