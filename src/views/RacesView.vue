<script setup lang="ts">
import { useDialog } from '@/composables/useDialog'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { plansApi, racesApi } from '@/api'
import { ApiError } from '@/api/client'
import type { Race, RaceInput } from '@/api/types'
import RaceForm from '@/components/forms/RaceForm.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { distanceLabel, isTriathlon } from '@/utils/races'
import { addDays, nextSunday, formatDate, today } from '@/utils/dates'

const router = useRouter()
const { confirm } = useDialog()

const page = useAsync(async () => {
  const [races, planRaceId] = await Promise.all([
    racesApi.list(),
    plansApi.current().then(
      (p) => p.race?.id ?? null,
      (e: unknown) => {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      },
    ),
  ])
  return { races, planRaceId }
})

const { submitting, error, fieldErrors, submit } = useForm()
const editing = ref<number | 'new' | null>(null)
const draft = reactive<RaceInput>({
  name: '',
  distance: 'half',
  date: nextSunday(addDays(today(), 7 * 20)),
  priority: 'A',
})

const upcoming = computed(() => (page.data.value?.races ?? []).filter((r) => r.date >= today()))
const past = computed(() => (page.data.value?.races ?? []).filter((r) => r.date < today()).reverse())

function startNew(): void {
  Object.assign(draft, {
    name: '',
    distance: 'half',
    date: nextSunday(addDays(today(), 7 * 20)),
    priority: 'A',
  })
  editing.value = 'new'
}

function startEdit(race: Race): void {
  Object.assign(draft, { name: race.name, distance: race.distance, date: race.date, priority: race.priority })
  editing.value = race.id
}

async function save(): Promise<void> {
  const id = editing.value
  const saved = await submit(() =>
    id === 'new' ? racesApi.create({ ...draft }) : racesApi.update(id as number, { ...draft }),
  )

  if (saved) {
    editing.value = null
    await page.run()
  }
}

async function remove(race: Race): Promise<void> {
  const drivesPlan = race.id === page.data.value?.planRaceId
  const sure = await confirm({
    title: `Delete ${race.name}?`,
    message: drivesPlan ? 'Your plan for it is archived; its history stays.' : undefined,
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!sure) return
  await submit(() => racesApi.remove(race.id))
  if (!error.value) await page.run()
}

async function buildPlan(race: Race): Promise<void> {
  const replacing = page.data.value?.planRaceId
  if (
    replacing &&
    !(await confirm({
      title: 'Build a new plan?',
      message: 'Your current plan is archived; its history stays.',
      confirmLabel: 'Build plan',
    }))
  )
    return
  const plan = await submit(() => racesApi.createPlan(race.id))
  if (plan) await router.push({ name: 'plan' })
}
</script>

<template>
  <LoadingState :loading="page.loading.value" :error="page.error.value" @retry="page.run">
    <div class="mx-auto max-w-3xl space-y-6">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold">Races</h1>
        <AppButton v-if="editing === null" @click="startNew">Add race</AppButton>
      </header>

      <AppAlert v-if="error && editing === null" tone="error">{{ error }}</AppAlert>

      <AppCard v-if="editing !== null" :title="editing === 'new' ? 'New race' : 'Edit race'">
        <form class="space-y-4" @submit.prevent="save">
          <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>
          <RaceForm v-model="draft" :errors="fieldErrors" show-priority />
          <p class="text-sm text-slate-500">
            Adding or changing a B or C race inside your plan re-plans around it automatically.
          </p>
          <div class="flex justify-end gap-2">
            <AppButton variant="ghost" @click="editing = null">Cancel</AppButton>
            <AppButton type="submit" :loading="submitting">Save</AppButton>
          </div>
        </form>
      </AppCard>

      <AppCard title="Upcoming">
        <p v-if="upcoming.length === 0" class="text-sm text-slate-500">
          No races yet. Add your goal race to get a plan.
        </p>
        <ul class="divide-y divide-slate-100">
          <li
            v-for="race in upcoming"
            :key="race.id"
            class="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <span
              class="grid size-8 place-items-center rounded-full text-sm font-bold"
              :class="
                race.priority === 'A'
                  ? 'bg-indigo-600 text-white'
                  : race.priority === 'B'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-slate-100 text-slate-700'
              "
              :aria-label="`${race.priority} race`"
            >
              {{ race.priority }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-medium">
                {{ race.name }}
                <span
                  v-if="race.id === page.data.value?.planRaceId"
                  class="ml-1 rounded bg-emerald-100 px-1.5 text-xs text-emerald-800"
                  >Your plan</span
                >
              </p>
              <p class="text-sm text-slate-500">
                {{ distanceLabel(race.distance) }} ·
                {{ formatDate(race.date, { day: 'numeric', month: 'long', year: 'numeric' }) }} ·
                {{ race.days_to_go }} days
              </p>
            </div>
            <div class="flex gap-1.5">
              <AppButton
                v-if="
                  race.priority === 'A' &&
                  isTriathlon(race.distance) &&
                  race.id !== page.data.value?.planRaceId
                "
                size="sm"
                :loading="submitting"
                @click="buildPlan(race)"
              >
                Build plan
              </AppButton>
              <AppButton size="sm" variant="secondary" @click="startEdit(race)">Edit</AppButton>
              <AppButton size="sm" variant="ghost" @click="remove(race)">Delete</AppButton>
            </div>
          </li>
        </ul>
      </AppCard>

      <AppCard v-if="past.length" title="Past races">
        <ul class="space-y-1 text-sm text-slate-600">
          <li v-for="race in past" :key="race.id">
            {{ formatDate(race.date, { day: 'numeric', month: 'short', year: 'numeric' }) }} ·
            {{ race.name }} ({{ race.priority }})
          </li>
        </ul>
      </AppCard>
    </div>
  </LoadingState>
</template>
