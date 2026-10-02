<script setup lang="ts">
import { useDialog } from '@/composables/useDialog'
import { reactive, ref, watch } from 'vue'
import { activitiesApi, feedbackApi } from '@/api'
import type { Activity, ActivityInput, SessionFeedback, Sport } from '@/api/types'
import SportBadge from '@/components/SportBadge.vue'
import FeelForm from '@/components/feel/FeelForm.vue'
import FeelTrends from '@/components/feel/FeelTrends.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppField from '@/components/ui/AppField.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { formatDateTime, today } from '@/utils/dates'
import { feelSummary } from '@/utils/feel'
import { formatClock, formatDistance, formatDuration, formatTss, parseClock, titleCase } from '@/utils/format'

const { confirm } = useDialog()
const sport = ref<string>('')
const page = ref(1)

const list = useAsync(() => activitiesApi.list({ sport: sport.value || undefined, page: page.value }))
watch([sport, page], () => list.run())
watch(sport, () => (page.value = 1))

/** How rated sessions felt over the last eight weeks. */
const TREND_DAYS = 56
const trends = useAsync(() => feedbackApi.history(TREND_DAYS))

/** The activity whose rating form is open, if any. */
const rating = ref<number | null>(null)

function rated(activity: Activity, feedback: SessionFeedback | null): void {
  const data = list.data.value
  if (data) {
    list.data.value = { ...data, data: data.data.map((a) => (a.id === activity.id ? { ...a, feedback } : a)) }
  }
  rating.value = null
  void trends.run()
}

const { submitting, error, fieldErrors, submit } = useForm()
const showForm = ref(false)

function emptyDraft() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())

  return {
    sport: 'run' as ActivityInput['sport'],
    name: '',
    started_at: now.toISOString().slice(0, 16),
    duration: '1:00',
    distance_km: '',
    avg_hr: '',
    np_w: '',
    tss: '',
  }
}

const draft = reactive(emptyDraft())

/** Typed duration "h:mm" in minutes, stored as seconds. */
function durationSeconds(value: string): number | null {
  const minutes = parseClock(value)
  return minutes === null ? null : minutes * 60
}

const num = (value: string) => (value.trim() === '' ? null : Number(value))

async function log(): Promise<void> {
  const duration = durationSeconds(draft.duration)

  if (duration === null) {
    fieldErrors.duration_s = 'Use hours:minutes, e.g. 1:15.'
    return
  }

  const created = await submit(() =>
    activitiesApi.create({
      sport: draft.sport,
      name: draft.name || null,
      started_at: new Date(draft.started_at).toISOString(),
      duration_s: duration,
      distance_m: draft.distance_km === '' ? null : Math.round(Number(draft.distance_km) * 1000),
      avg_hr: num(draft.avg_hr),
      np_w: draft.sport === 'bike' ? num(draft.np_w) : null,
      tss: num(draft.tss),
    }),
  )

  if (created) {
    Object.assign(draft, emptyDraft())
    showForm.value = false
    page.value = 1
    await list.run()
  }
}

async function remove(activity: Activity): Promise<void> {
  const sure = await confirm({
    title: 'Delete this activity?',
    message: 'Your fitness numbers are recalculated without it.',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!sure) return
  await submit(() => activitiesApi.remove(activity.id))
  if (!error.value) await list.run()
}

/** Average pace, worked out from distance and time when the source did not report it. */
function pace(activity: Activity): string | null {
  const per = activity.sport === 'run' ? 1000 : activity.sport === 'swim' ? 100 : null

  if (per === null) return null

  const seconds =
    activity.avg_pace ?? (activity.distance_m ? (activity.duration_s / activity.distance_m) * per : null)

  return seconds === null ? null : `${formatClock(seconds)} ${per === 1000 ? '/km' : '/100m'}`
}

const SPORT_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  ...(['swim', 'bike', 'run', 'strength'] as Sport[]).map((s) => ({ value: s, label: titleCase(s) })),
]
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">Activities</h1>
      <AppButton v-if="!showForm" @click="showForm = true">Log an activity</AppButton>
    </header>

    <AppCard v-if="showForm" title="Log an activity">
      <form class="space-y-4" @submit.prevent="log">
        <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>
        <div class="grid gap-4 sm:grid-cols-3">
          <AppField v-slot="{ id }" label="Sport" :error="fieldErrors.sport">
            <select
              :id="id"
              v-model="draft.sport"
              class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
            >
              <option value="swim">Swim</option>
              <option value="bike">Bike</option>
              <option value="run">Run</option>
              <option value="strength">Strength</option>
            </select>
          </AppField>
          <AppField
            v-model="draft.started_at"
            label="Started"
            type="datetime-local"
            required
            :error="fieldErrors.started_at"
          />
          <AppField
            v-model="draft.duration"
            label="Duration (h:mm)"
            placeholder="1:15"
            required
            :error="fieldErrors.duration_s"
          />
          <AppField
            v-model="draft.name"
            label="Name"
            placeholder="Morning run"
            :error="fieldErrors.name"
            class="sm:col-span-3"
          />
          <AppField
            v-model="draft.distance_km"
            label="Distance (km)"
            type="number"
            step="0.01"
            min="0"
            :error="fieldErrors.distance_m"
          />
          <AppField
            v-model="draft.avg_hr"
            label="Average heart rate"
            type="number"
            :error="fieldErrors.avg_hr"
          />
          <AppField
            v-if="draft.sport === 'bike'"
            v-model="draft.np_w"
            label="Normalized power (W)"
            type="number"
            :error="fieldErrors.np_w"
          />
          <AppField
            v-model="draft.tss"
            label="TSS (optional)"
            type="number"
            hint="Leave empty and the coach works it out."
            :error="fieldErrors.tss"
          />
        </div>
        <div class="flex justify-end gap-2">
          <AppButton variant="ghost" @click="showForm = false">Cancel</AppButton>
          <AppButton type="submit" :loading="submitting">Save</AppButton>
        </div>
      </form>
    </AppCard>

    <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by sport">
      <button
        v-for="f in SPORT_FILTERS"
        :key="f.value"
        type="button"
        class="rounded-full px-3 py-1 text-sm ring-1"
        :class="
          sport === f.value
            ? 'bg-indigo-600 text-white ring-indigo-600'
            : 'bg-surface text-slate-700 ring-slate-300'
        "
        :aria-pressed="sport === f.value"
        @click="sport = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <AppCard title="How you've felt">
      <LoadingState
        :loading="trends.loading.value && !trends.data.value"
        :error="trends.error.value"
        @retry="trends.run"
      >
        <FeelTrends :entries="trends.data.value ?? []" :days="TREND_DAYS" :today="today()" />
      </LoadingState>
    </AppCard>

    <LoadingState
      :loading="list.loading.value && !list.data.value"
      :error="list.error.value"
      @retry="list.run"
    >
      <AppCard>
        <p v-if="list.data.value?.data.length === 0" class="py-6 text-center text-sm text-slate-500">
          Nothing here yet. Connect Strava in settings or log an activity.
        </p>
        <ul class="divide-y divide-slate-100" :class="{ 'opacity-60': list.loading.value }">
          <li v-for="a in list.data.value?.data" :key="a.id" class="py-3 first:pt-0 last:pb-0">
            <div class="flex items-start gap-3">
              <SportBadge :sport="a.sport" class="mt-0.5" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ a.name ?? titleCase(a.sport) }}</p>
                <p class="text-xs text-slate-500">
                  {{ formatDateTime(a.started_at) }} · {{ titleCase(a.source) }}
                  <RouterLink
                    v-if="a.planned_workout_id"
                    :to="{ name: 'workout', params: { id: a.planned_workout_id } }"
                    class="text-indigo-600 hover:underline"
                  >
                    · planned session
                  </RouterLink>
                </p>
                <p class="mt-0.5 text-sm text-slate-700 tabular-nums">
                  {{ formatDuration(a.duration_s)
                  }}<template v-if="a.distance_m"> · {{ formatDistance(a.distance_m) }}</template>
                  <template v-if="pace(a)"> · {{ pace(a) }}</template>
                </p>
              </div>
              <p
                class="shrink-0 text-right text-sm font-medium tabular-nums"
                :title="a.tss_method ? `From ${titleCase(a.tss_method)}` : undefined"
              >
                {{ formatTss(a.tss) }} TSS
              </p>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="rounded-full px-2.5 py-0.5 text-left text-xs ring-1"
                :class="
                  a.feedback
                    ? 'bg-slate-50 text-slate-700 ring-slate-200 hover:ring-indigo-300'
                    : 'font-medium text-indigo-700 ring-indigo-200 hover:bg-indigo-50'
                "
                :aria-expanded="rating === a.id"
                @click="rating = rating === a.id ? null : a.id"
              >
                {{ a.feedback ? feelSummary(a.feedback) : 'How did it feel?' }}
              </button>
              <button
                v-if="a.source === 'manual'"
                class="ml-auto text-xs text-slate-500 hover:text-rose-700"
                @click="remove(a)"
              >
                Delete
              </button>
            </div>
            <div v-if="rating === a.id" class="mt-3 rounded-lg bg-slate-50 p-4">
              <FeelForm
                :activity-id="a.id"
                :feedback="a.feedback"
                @saved="(f) => rated(a, f)"
                @removed="rated(a, null)"
              />
            </div>
          </li>
        </ul>
        <nav
          v-if="(list.data.value?.meta.last_page ?? 1) > 1"
          class="mt-4 flex items-center justify-between text-sm"
          aria-label="Pages"
        >
          <AppButton size="sm" variant="secondary" :disabled="page <= 1" @click="page--">Newer</AppButton>
          <span class="text-slate-500">Page {{ page }} of {{ list.data.value?.meta.last_page }}</span>
          <AppButton
            size="sm"
            variant="secondary"
            :disabled="page >= (list.data.value?.meta.last_page ?? 1)"
            @click="page++"
            >Older</AppButton
          >
        </nav>
      </AppCard>
    </LoadingState>
  </div>
</template>
