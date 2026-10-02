<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { workoutsApi } from '@/api'
import type { PlannedWorkoutDetail, StructureBlock } from '@/api/types'
import SportBadge from '@/components/SportBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import StepList from '@/components/StepList.vue'
import WorkoutProfile from '@/components/charts/WorkoutProfile.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { formatDate, today } from '@/utils/dates'
import { formatDistance, formatDuration, formatPercent, formatTss, titleCase } from '@/utils/format'
import { isOpenStatus } from '@/utils/sports'

const props = defineProps<{ id: string }>()
const router = useRouter()

const workout = useAsync(() => workoutsApi.get(Number(props.id)))
const { submitting, error, submit } = useForm()
const moveTo = ref('')

const w = computed<PlannedWorkoutDetail | null>(() => workout.data.value)
/** True when at least one step could be resolved against the athlete's thresholds. */
function anyResolved(blocks: StructureBlock[]): boolean {
  return blocks.some((b) => (b.type === 'repeat' ? anyResolved(b.steps) : Boolean(b.resolved)))
}

const hasResolvedTargets = computed(() => anyResolved(w.value?.resolved_structure?.steps ?? []))
const editable = computed(
  () => w.value !== null && w.value.parent_id === null && isOpenStatus(w.value.status),
)

async function move(): Promise<void> {
  const updated = await submit(() => workoutsApi.move(Number(props.id), moveTo.value))
  if (updated) workout.data.value = updated
}

async function skip(): Promise<void> {
  if (!window.confirm('Skip this workout? The coach will not reschedule it.')) return
  const updated = await submit(() => workoutsApi.skip(Number(props.id)))
  if (updated) workout.data.value = updated
}
</script>

<template>
  <LoadingState :loading="workout.loading.value" :error="workout.error.value" @retry="workout.run">
    <div v-if="w" class="mx-auto max-w-3xl space-y-6">
      <button class="text-sm text-slate-500 hover:text-slate-800" @click="router.back()">← Back</button>

      <header>
        <div class="flex flex-wrap items-center gap-2">
          <SportBadge :sport="w.sport" />
          <StatusBadge :status="w.status" />
          <span
            v-if="w.is_key"
            class="rounded bg-indigo-50 px-1.5 text-xs font-semibold text-indigo-700 uppercase"
            >Key session</span
          >
        </div>
        <h1 class="mt-2 text-2xl font-semibold">{{ w.title }}</h1>
        <p class="text-slate-600">
          {{ formatDate(w.date, { weekday: 'long', day: 'numeric', month: 'long' }) }} ·
          {{ titleCase(w.kind) }}
        </p>
      </header>

      <dl class="grid grid-cols-3 gap-3 rounded-lg bg-white p-4 text-center shadow-xs ring-1 ring-slate-200">
        <div>
          <dt class="text-xs text-slate-500">Duration</dt>
          <dd class="text-lg font-semibold">{{ formatDuration(w.target_duration_s) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">Training load</dt>
          <dd class="text-lg font-semibold">{{ formatTss(w.target_tss) }} TSS</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">{{ w.target_distance_m ? 'Distance' : 'Compliance' }}</dt>
          <dd class="text-lg font-semibold">
            {{
              w.target_distance_m
                ? formatDistance(w.target_distance_m)
                : w.compliance !== null
                  ? formatPercent(w.compliance)
                  : '–'
            }}
          </dd>
        </div>
      </dl>

      <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>

      <AppCard v-if="w.children?.length" title="Brick">
        <p class="mb-3 text-sm text-slate-600">Ride, then run straight off the bike.</p>
        <ul class="space-y-2">
          <li v-for="part in w.children" :key="part.id">
            <RouterLink
              :to="{ name: 'workout', params: { id: part.id } }"
              class="flex justify-between rounded-md px-3 py-2 ring-1 ring-slate-200 hover:ring-indigo-300"
            >
              <span class="text-sm font-medium">{{ part.title }}</span>
              <span class="text-sm text-slate-500"
                >{{ formatDuration(part.target_duration_s) }} · <StatusBadge :status="part.status"
              /></span>
            </RouterLink>
          </li>
        </ul>
      </AppCard>

      <AppCard v-if="w.resolved_structure" title="Session">
        <WorkoutProfile :blocks="w.resolved_structure.steps" :sport="w.sport" class="mb-4" />
        <StepList :blocks="w.resolved_structure.steps" />
        <p v-if="!hasResolvedTargets" class="mt-3 text-sm text-slate-500">
          Add your thresholds in
          <RouterLink :to="{ name: 'settings' }" class="text-indigo-600 hover:underline">settings</RouterLink>
          to see watts and paces instead of percentages.
        </p>
      </AppCard>

      <AppCard v-if="w.activity" title="What you did">
        <p class="text-sm">
          {{ w.activity.name ?? 'Activity' }} · {{ formatDuration(w.activity.duration_s) }} ·
          {{ formatTss(w.activity.tss) }} TSS
        </p>
      </AppCard>

      <AppCard v-if="editable" title="Change it">
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="move">
          <label class="text-sm">
            <span class="block font-medium text-slate-700">Move to</span>
            <input
              v-model="moveTo"
              type="date"
              :min="today()"
              required
              class="mt-1 rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
            />
          </label>
          <AppButton type="submit" variant="secondary" :loading="submitting" :disabled="!moveTo"
            >Move</AppButton
          >
          <AppButton variant="ghost" class="ml-auto" :disabled="submitting" @click="skip"
            >Skip this workout</AppButton
          >
        </form>
      </AppCard>
    </div>
  </LoadingState>
</template>
