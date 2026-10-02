<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { calendarApi, workoutsApi } from '@/api'
import type { CalendarDay, PlannedWorkout } from '@/api/types'
import SportBadge from '@/components/SportBadge.vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { errorMessage, useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { WEEKDAYS, addDays, formatDate, parseDate, startOfWeek, today } from '@/utils/dates'
import { formatDuration, formatTss } from '@/utils/format'
import { isOpenStatus } from '@/utils/sports'

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

/** A day's own availability in a few words: "Sick: Flu", "Easy day · 45 min". */
function availabilityLabel(day: CalendarDay): string | null {
  const a = day.availability
  if (!a) return null
  const what =
    a.available_minutes === 0
      ? 'No training'
      : a.easy_only
        ? `Easy day · ${a.available_minutes} min`
        : `${a.available_minutes} min available`
  return a.note && a.available_minutes === 0 ? a.note : a.note ? `${what} · ${a.note}` : what
}

const dayTime = (day: CalendarDay) =>
  day.workouts.filter((w) => w.status !== 'dropped').reduce((sum, w) => sum + w.target_duration_s, 0)

/*
 * Drag a session to another day to reschedule it. Keyboard and touch users
 * get the same through "Move to" on the workout page.
 */
const toast = useToast()
const dragging = ref<PlannedWorkout | null>(null)
const dropTarget = ref<string | null>(null)

const movable = (w: PlannedWorkout) =>
  w.parent_id === null && w.activity_id === null && isOpenStatus(w.status)
const canDrop = (date: string) => dragging.value !== null && date >= today() && date !== dragging.value.date

function dragStart(event: DragEvent, workout: PlannedWorkout): void {
  dragging.value = workout
  event.dataTransfer?.setData('text/plain', String(workout.id))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function dragOver(event: DragEvent, date: string): void {
  if (!canDrop(date)) return
  event.preventDefault()
  dropTarget.value = date
}

function dragEnd(): void {
  dragging.value = null
  dropTarget.value = null
}

async function moveWorkout(workout: PlannedWorkout, date: string): Promise<boolean> {
  try {
    await workoutsApi.move(workout.id, date)
    await calendar.run()

    return true
  } catch (e) {
    toast.error(errorMessage(e))

    return false
  }
}

async function drop(date: string): Promise<void> {
  const workout = dragging.value
  dragEnd()
  if (!workout || date < today() || date === workout.date) return

  const from = workout.date
  if (await moveWorkout(workout, date)) {
    toast.success(`Moved "${workout.title}" to ${formatDate(date)}.`, {
      label: 'Undo',
      run: async () => {
        if (await moveWorkout(workout, from)) toast.info(`"${workout.title}" is back on ${formatDate(from)}.`)
      },
    })
  }
}
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
                : 'bg-surface text-slate-700'
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
      <!-- Phones: one day per row. -->
      <ol class="space-y-3 md:hidden" :class="{ 'opacity-60': calendar.loading.value }">
        <li
          v-for="day in calendar.data.value?.data ?? []"
          :key="day.date"
          class="rounded-lg p-3"
          :class="
            day.date === today() ? 'bg-indigo-50 ring-1 ring-indigo-300' : 'bg-surface ring-1 ring-slate-200'
          "
        >
          <p class="mb-2 flex justify-between text-sm font-medium">
            <span :class="day.date === today() ? 'text-indigo-700' : 'text-slate-700'">
              {{ day.date === today() ? 'Today · ' : '' }}{{ formatDate(day.date) }}
            </span>
            <span v-if="dayTime(day)" class="text-slate-500 tabular-nums">{{
              formatDuration(dayTime(day))
            }}</span>
          </p>
          <div class="space-y-1.5">
            <p
              v-if="availabilityLabel(day)"
              class="rounded-md bg-slate-100 px-2 py-1.5 text-sm text-slate-700"
            >
              {{ availabilityLabel(day) }}
            </p>
            <p
              v-for="race in day.races"
              :key="race.id"
              class="rounded-md bg-amber-100 px-2 py-1.5 text-sm font-semibold text-amber-900"
            >
              {{ race.priority }} race · {{ race.name }}
            </p>
            <WorkoutCard v-for="w in day.workouts" :key="w.id" :workout="w" />
            <p
              v-for="a in extras(day)"
              :key="a.id"
              class="rounded-md px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-300 ring-dashed"
            >
              <SportBadge :sport="a.sport" />
              {{ a.name ?? 'Extra session' }} · {{ formatDuration(a.duration_s) }}
            </p>
            <p
              v-if="!day.workouts.length && !day.races.length && !extras(day).length && !day.availability"
              class="text-sm text-slate-400"
            >
              Rest
            </p>
          </div>
        </li>
      </ol>

      <!-- Larger screens: a week grid where sessions can be dragged to another day. -->
      <div class="hidden md:block">
        <p class="mb-2 text-xs text-slate-500">Drag an upcoming session to another day to move it.</p>
        <div class="grid grid-cols-7 gap-2" :class="{ 'opacity-60': calendar.loading.value }">
          <p v-for="day in WEEKDAYS" :key="day.value" class="px-1 text-xs font-medium text-slate-500">
            {{ day.short }}
          </p>
          <template v-for="(row, r) in rows" :key="r">
            <section
              v-for="day in row"
              :key="day.date"
              class="min-h-32 min-w-0 rounded-lg p-2 transition"
              :class="[
                day.date === today() ? 'bg-indigo-50 ring-1 ring-indigo-300' : 'bg-slate-100/70',
                dropTarget === day.date ? 'bg-indigo-100! ring-2! ring-indigo-500!' : '',
                dragging && !canDrop(day.date) && day.date !== dragging.date ? 'opacity-50' : '',
              ]"
              :aria-label="formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' })"
              @dragover="dragOver($event, day.date)"
              @dragleave="dropTarget === day.date && (dropTarget = null)"
              @drop.prevent="drop(day.date)"
            >
              <p
                class="mb-1.5 flex justify-between text-xs font-medium"
                :class="day.date === today() ? 'text-indigo-700' : 'text-slate-500'"
              >
                <span>{{ formatDate(day.date, { day: 'numeric', month: 'short' }) }}</span>
                <span v-if="dayTime(day)" class="font-normal tabular-nums">{{
                  formatDuration(dayTime(day))
                }}</span>
              </p>
              <div class="space-y-1.5">
                <p
                  v-if="availabilityLabel(day)"
                  class="rounded-md bg-surface/70 px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
                >
                  {{ availabilityLabel(day) }}
                </p>
                <p
                  v-for="race in day.races"
                  :key="race.id"
                  class="rounded-md bg-amber-100 px-2 py-1.5 text-xs font-semibold text-amber-900"
                >
                  {{ race.priority }} race · {{ race.name }}
                </p>
                <div
                  v-for="w in day.workouts"
                  :key="w.id"
                  :draggable="movable(w)"
                  :class="{
                    'cursor-grab active:cursor-grabbing': movable(w),
                    'opacity-40': dragging?.id === w.id,
                  }"
                  @dragstart="dragStart($event, w)"
                  @dragend="dragEnd"
                >
                  <WorkoutCard :workout="w" compact />
                </div>
                <div
                  v-for="a in extras(day)"
                  :key="a.id"
                  class="rounded-md bg-surface px-2 py-1.5 text-xs ring-1 ring-slate-300 ring-dashed"
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
