<script setup lang="ts">
import { useDialog } from '@/composables/useDialog'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { plansApi } from '@/api'
import { ApiError } from '@/api/client'
import type { PhaseType, PlanRevision, RevisionReason, WeekProgress } from '@/api/types'
import CoachNotes from '@/components/CoachNotes.vue'
import WeeklyLoadChart from '@/components/charts/WeeklyLoadChart.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { distanceLabel } from '@/utils/races'
import { daysBetween, formatDate, formatDateTime, startOfWeek, today } from '@/utils/dates'
import { formatDuration, formatPercent, formatTss } from '@/utils/format'

const router = useRouter()
const { confirm, prompt } = useDialog()

const page = useAsync(async () => {
  let plan
  try {
    plan = await plansApi.current()
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
  const [full, progress, revisions] = await Promise.all([
    plansApi.get(plan.id),
    plansApi.progress(plan.id),
    plansApi.revisions(plan.id),
  ])

  return { plan: full, progress, revisions: revisions.data }
})

const { submitting, error, submit } = useForm()
const currentWeek = startOfWeek(today())
const showAllWeeks = ref(false)
const openRevision = ref<number | null>(null)

const plan = computed(() => page.data.value?.plan ?? null)
const totalDays = computed(() =>
  plan.value?.phases?.length
    ? daysBetween(plan.value.phases[0].start_date, plan.value.phases.at(-1)!.end_date) + 1
    : 1,
)

const PHASES: Record<PhaseType, { label: string; classes: string }> = {
  base: { label: 'Base', classes: 'bg-sky-100 text-sky-900' },
  build: { label: 'Build', classes: 'bg-indigo-100 text-indigo-900' },
  peak: { label: 'Peak', classes: 'bg-violet-200 text-violet-900' },
  taper: { label: 'Taper', classes: 'bg-emerald-100 text-emerald-900' },
}

const REASONS: Record<RevisionReason, string> = {
  generated: 'Created',
  regenerated: 'Re-planned',
  adapted: 'Coach adjusted',
  manual: 'You changed',
}

const weeks = computed<WeekProgress[]>(() => {
  const all = page.data.value?.progress ?? []
  if (showAllWeeks.value) return all
  const index = all.findIndex((w) => w.start_date === currentWeek)
  return index < 0 ? all.slice(0, 6) : all.slice(Math.max(0, index - 2), index + 4)
})

async function regenerate(): Promise<void> {
  const reason = await prompt({
    title: 'Re-plan from today?',
    message:
      'Upcoming sessions are rebuilt with your current fitness, thresholds and settings. Completed training stays.',
    label: 'Why (shown in the change log)',
    defaultValue: 'Re-planned on request.',
    confirmLabel: 'Re-plan',
  })
  if (reason === null || !plan.value) return
  const done = await submit(() => plansApi.regenerate(plan.value!.id, reason || undefined))
  if (done) await page.run()
}

async function archive(): Promise<void> {
  if (!plan.value) return
  const archiveIt = await confirm({
    title: 'Archive this plan?',
    message: 'Its upcoming sessions leave your calendar; the history stays.',
    confirmLabel: 'Archive',
    danger: true,
  })
  if (!archiveIt) return
  const done = await submit(() => plansApi.archive(plan.value!.id))
  if (done) await page.run()
}

function openWeek(week: WeekProgress): void {
  void router.push({ name: 'calendar', query: { week: week.start_date } })
}

function changeLines(revision: PlanRevision): string[] {
  return revision.changes.map((c) => {
    if (c.reason) return c.reason
    if (c.type === 'week_load')
      return `Week of ${formatDate(c.week_start!, { day: 'numeric', month: 'short' })}: ${formatTss(c.from_tss)} → ${formatTss(c.to_tss)} TSS`
    if (c.type === 'moved') return `Moved a workout from ${formatDate(c.from!)} to ${formatDate(c.to!)}`
    return c.type
  })
}
</script>

<template>
  <LoadingState :loading="page.loading.value" :error="page.error.value" @retry="page.run">
    <div v-if="!plan" class="mx-auto max-w-lg py-10 text-center">
      <h1 class="text-xl font-semibold">No active plan</h1>
      <p class="mt-2 text-slate-600">
        Add your goal race and the coach builds a plan working backwards from race day.
      </p>
      <RouterLink
        :to="{ name: 'races' }"
        class="mt-4 inline-block font-medium text-indigo-600 hover:underline"
        >Go to races →</RouterLink
      >
    </div>

    <div v-else class="space-y-6">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm text-slate-500">
            Plan v{{ plan.version }} · started {{ formatDate(plan.start_date) }}
          </p>
          <h1 class="text-2xl font-semibold">{{ plan.race?.name }}</h1>
          <p class="text-slate-600">
            {{
              plan.race &&
              formatDate(plan.race.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            }}
            · {{ plan.race?.days_to_go }} days to go
          </p>
        </div>
        <div class="flex gap-2">
          <AppButton variant="secondary" :loading="submitting" @click="regenerate"
            >Re-plan from today</AppButton
          >
          <AppButton variant="ghost" :disabled="submitting" @click="archive">Archive</AppButton>
        </div>
      </header>

      <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>
      <CoachNotes :notes="plan.warnings" open />

      <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <dt class="text-xs text-slate-500">Fitness at start</dt>
          <dd class="text-xl font-semibold">{{ Math.round(plan.starting_ctl) }}</dd>
        </div>
        <div class="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <dt class="text-xs text-slate-500">Peak fitness target</dt>
          <dd class="text-xl font-semibold">{{ Math.round(plan.target_ctl) }}</dd>
        </div>
        <div class="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <dt class="text-xs text-slate-500">Weeks</dt>
          <dd class="text-xl font-semibold">{{ plan.weeks?.length }}</dd>
        </div>
        <div class="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <dt class="text-xs text-slate-500">Distance</dt>
          <dd class="text-xl font-semibold">{{ plan.race && distanceLabel(plan.race.distance) }}</dd>
        </div>
      </dl>

      <AppCard title="Phases">
        <ol class="flex overflow-hidden rounded-md text-xs font-medium">
          <li
            v-for="phase in plan.phases"
            :key="phase.start_date"
            class="min-w-0 truncate px-2 py-2"
            :class="PHASES[phase.type].classes"
            :style="{ width: `${((daysBetween(phase.start_date, phase.end_date) + 1) / totalDays) * 100}%` }"
            :title="`${PHASES[phase.type].label}: ${formatDate(phase.start_date)} – ${formatDate(phase.end_date)}`"
          >
            {{ PHASES[phase.type].label }}
          </li>
        </ol>
        <p class="mt-2 text-sm text-slate-600">
          Base builds aerobic fitness, build adds threshold work, peak is race-specific, and the taper lets
          you arrive fresh.
        </p>
      </AppCard>

      <AppCard title="Weekly load">
        <WeeklyLoadChart
          :weeks="page.data.value?.progress ?? []"
          :current-week="currentWeek"
          @select="openWeek"
        />
      </AppCard>

      <AppCard title="Weeks">
        <template #actions>
          <button class="text-sm text-indigo-600 hover:underline" @click="showAllWeeks = !showAllWeeks">
            {{ showAllWeeks ? 'Show around now' : 'Show all' }}
          </button>
        </template>
        <div class="overflow-x-auto">
          <table class="w-full text-sm sm:min-w-[40rem]">
            <thead class="text-left text-xs text-slate-500">
              <tr>
                <th class="py-2 font-medium">Week</th>
                <th class="py-2 font-medium">Phase</th>
                <th class="py-2 text-right font-medium">Planned</th>
                <th class="hidden py-2 text-right font-medium sm:table-cell">Done</th>
                <th class="hidden py-2 text-right font-medium sm:table-cell">Compliance</th>
                <th class="py-2 text-right font-medium">Sessions</th>
              </tr>
            </thead>
            <tbody class="tabular-nums">
              <tr
                v-for="week in weeks"
                :key="week.start_date"
                class="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                :class="{ 'bg-indigo-50/60': week.start_date === currentWeek }"
                @click="openWeek(week)"
              >
                <td class="py-2">{{ formatDate(week.start_date, { day: 'numeric', month: 'short' }) }}</td>
                <td class="py-2 capitalize">
                  {{ week.phase }}<span v-if="week.is_recovery" class="text-slate-500"> · recovery</span>
                </td>
                <td class="py-2 text-right">
                  {{ formatTss(week.planned.tss) }} TSS · {{ formatDuration(week.planned.duration_s) }}
                </td>
                <td class="hidden py-2 text-right sm:table-cell">{{ formatTss(week.actual.tss) }} TSS</td>
                <td class="hidden py-2 text-right sm:table-cell">
                  {{ week.compliance === null ? '–' : formatPercent(week.compliance) }}
                </td>
                <td class="py-2 text-right">
                  {{ week.sessions.completed }}/{{ week.planned.sessions }}
                  <span v-if="week.sessions.missed" class="text-rose-700"
                    >· {{ week.sessions.missed }} missed</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <AppCard title="What changed and why">
        <ol class="divide-y divide-slate-100">
          <li v-for="revision in page.data.value?.revisions" :key="revision.version" class="py-3 first:pt-0">
            <button
              class="w-full text-left"
              :aria-expanded="openRevision === revision.version"
              @click="openRevision = openRevision === revision.version ? null : revision.version"
            >
              <p class="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span class="font-medium">v{{ revision.version }} · {{ REASONS[revision.reason] }}</span>
                <span class="text-xs text-slate-500">{{ formatDateTime(revision.created_at) }}</span>
              </p>
              <p class="mt-0.5 text-sm text-slate-700">{{ revision.summary }}</p>
            </button>
            <ul
              v-if="openRevision === revision.version && revision.changes.length"
              class="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-600"
            >
              <li v-for="(line, i) in changeLines(revision)" :key="i">{{ line }}</li>
            </ul>
          </li>
        </ol>
      </AppCard>
    </div>
  </LoadingState>
</template>
