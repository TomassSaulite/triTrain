<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { templatesApi } from '@/api'
import type { Discipline, PhaseType, RaceDistance, WorkoutKind } from '@/api/types'
import WorkoutProfile from '@/components/charts/WorkoutProfile.vue'
import StepEditor from '@/components/templates/StepEditor.vue'
import {
  fromStructure,
  starterBlocks,
  timedSeconds,
  toStructure,
  validateBlocks,
  type EditorBlock,
} from '@/components/templates/editor'
import { DISTANCES, KINDS, PHASES } from '@/components/templates/labels'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppField from '@/components/ui/AppField.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { formatDuration } from '@/utils/format'

/**
 * Creates a personal workout (blank, or copied from another), or edits one.
 */
const props = defineProps<{ id?: string }>()
const route = useRoute()
const router = useRouter()
const { submitting, error, fieldErrors, submit } = useForm()

const form = reactive({
  name: '',
  description: '',
  sport: 'bike' as Discipline,
  kind: 'endurance' as WorkoutKind,
  phases: ['base', 'build', 'peak', 'taper'] as PhaseType[],
  distances: [] as RaceDistance[],
  minMinutes: 45,
  maxMinutes: 120,
})
const blocks = ref<EditorBlock[]>(starterBlocks('bike'))
const problems = ref<string[]>([])

const sourceId = computed(() => Number(props.id ?? route.query.from) || null)
const loader = useAsync(async () => {
  if (!sourceId.value) return null
  const t = await templatesApi.get(sourceId.value)
  const sport = t.sport as Discipline
  Object.assign(form, {
    name: props.id ? t.name : `${t.name} (my version)`,
    description: t.description ?? '',
    sport,
    kind: t.kind,
    phases: [...t.phases],
    distances: [...(t.distances ?? [])],
    minMinutes: Math.round(t.min_s / 60),
    maxMinutes: Math.round(t.max_s / 60),
  })
  blocks.value = fromStructure(t.structure, sport)
  return t
})

// A new sport starts from that sport's usual targets and units.
watch(
  () => form.sport,
  (sport, previous) => {
    if (previous && !loader.loading.value) blocks.value = starterBlocks(sport)
  },
)

const preview = computed(() => toStructure(blocks.value))
const timed = computed(() => timedSeconds(blocks.value))

function toggle<T>(list: T[], value: T): void {
  const i = list.indexOf(value)
  if (i >= 0) list.splice(i, 1)
  else list.push(value)
}

async function save(): Promise<void> {
  problems.value = validateBlocks(blocks.value)
  if (form.phases.length === 0) problems.value.push('Pick at least one phase.')
  if (form.maxMinutes < form.minMinutes)
    problems.value.push('The longest version cannot be shorter than the shortest.')
  if (problems.value.length > 0) return

  const input = {
    name: form.name,
    description: form.description || null,
    sport: form.sport,
    kind: form.kind,
    phases: form.phases,
    distances: form.distances.length ? form.distances : null,
    min_s: form.minMinutes * 60,
    max_s: form.maxMinutes * 60,
    structure: preview.value,
  }
  const saved = await submit(() =>
    props.id ? templatesApi.update(Number(props.id), input) : templatesApi.create(input),
  )

  if (saved) await router.push({ name: 'library' })
}
</script>

<template>
  <LoadingState :loading="loader.loading.value" :error="loader.error.value" @retry="loader.run">
    <form class="mx-auto max-w-3xl space-y-6" @submit.prevent="save">
      <header>
        <button type="button" class="text-sm text-slate-500 hover:text-slate-800" @click="router.back()">
          ← Back
        </button>
        <h1 class="mt-2 text-2xl font-semibold">{{ id ? 'Edit workout' : 'New workout' }}</h1>
        <p class="text-sm text-slate-600">
          Targets are a share of your thresholds, so the workout fits you as your fitness changes. The coach
          scales the main set to the time a slot has.
        </p>
      </header>

      <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>
      <AppAlert v-if="problems.length" tone="error">
        <ul class="list-disc pl-4">
          <li v-for="p in problems" :key="p">{{ p }}</li>
        </ul>
      </AppAlert>

      <AppCard title="About">
        <div class="grid gap-4 sm:grid-cols-2">
          <AppField
            v-model="form.name"
            label="Name"
            required
            :error="fieldErrors.name"
            class="sm:col-span-2"
          />
          <AppField v-slot="{ id: fieldId }" label="Sport" :error="fieldErrors.sport">
            <select
              :id="fieldId"
              v-model="form.sport"
              class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
            >
              <option value="swim">Swim</option>
              <option value="bike">Bike</option>
              <option value="run">Run</option>
            </select>
          </AppField>
          <AppField
            v-slot="{ id: fieldId }"
            label="Kind"
            :error="fieldErrors.kind"
            hint="Which slot of the week it can fill."
          >
            <select
              :id="fieldId"
              v-model="form.kind"
              class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
            >
              <option v-for="k in KINDS" :key="k.value" :value="k.value">{{ k.label }}</option>
            </select>
          </AppField>
          <AppField
            v-model.number="form.minMinutes"
            label="Shortest version (minutes)"
            type="number"
            min="10"
            :error="fieldErrors.min_s"
          />
          <AppField
            v-model.number="form.maxMinutes"
            label="Longest version (minutes)"
            type="number"
            min="10"
            :error="fieldErrors.max_s"
          />
          <AppField v-slot="{ id: fieldId }" label="Description" class="sm:col-span-2">
            <textarea
              :id="fieldId"
              v-model="form.description"
              rows="2"
              class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
            />
          </AppField>
          <fieldset>
            <legend class="text-sm font-medium text-slate-700">Phases</legend>
            <div class="mt-1 flex flex-wrap gap-3">
              <label v-for="p in PHASES" :key="p.value" class="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  :checked="form.phases.includes(p.value)"
                  class="size-4 rounded border-slate-300 text-indigo-600"
                  @change="toggle(form.phases, p.value)"
                />
                {{ p.label }}
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend class="text-sm font-medium text-slate-700">Race distances</legend>
            <div class="mt-1 flex flex-wrap gap-3">
              <label v-for="d in DISTANCES" :key="d.value" class="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  :checked="form.distances.includes(d.value)"
                  class="size-4 rounded border-slate-300 text-indigo-600"
                  @change="toggle(form.distances, d.value)"
                />
                {{ d.label }}
              </label>
            </div>
            <p class="mt-1 text-xs text-slate-500">None ticked: any distance.</p>
          </fieldset>
        </div>
      </AppCard>

      <AppCard title="Steps">
        <template #actions>
          <span v-if="timed" class="text-sm text-slate-500">{{ formatDuration(timed) }} as written</span>
        </template>
        <WorkoutProfile :blocks="preview.steps" :sport="form.sport" class="mb-4" />
        <StepEditor v-model="blocks" :sport="form.sport" />
        <p v-if="fieldErrors.structure" class="mt-2 text-sm text-rose-600">{{ fieldErrors.structure }}</p>
      </AppCard>

      <div class="flex justify-end gap-2">
        <AppButton variant="ghost" @click="router.back()">Cancel</AppButton>
        <AppButton type="submit" :loading="submitting">Save workout</AppButton>
      </div>
    </form>
  </LoadingState>
</template>
