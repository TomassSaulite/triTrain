<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { templatesApi } from '@/api'
import type { Discipline, WorkoutKind, WorkoutTemplate } from '@/api/types'
import SportBadge from '@/components/SportBadge.vue'
import StepList from '@/components/StepList.vue'
import WorkoutProfile from '@/components/charts/WorkoutProfile.vue'
import { KINDS, kindLabel } from '@/components/templates/labels'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useDialog } from '@/composables/useDialog'
import { useForm } from '@/composables/useForm'
import { formatDuration, titleCase } from '@/utils/format'

const router = useRouter()
const { confirm } = useDialog()
const { error, submit } = useForm()

const library = useAsync(() => templatesApi.list())
const sport = ref<Discipline | ''>('')
const kind = ref<WorkoutKind | ''>('')
const mineOnly = ref(false)
const selectedId = ref<number | null>(null)

const templates = computed(() =>
  (library.data.value ?? []).filter(
    (t) =>
      (!sport.value || t.sport === sport.value) &&
      (!kind.value || t.kind === kind.value) &&
      (!mineOnly.value || !t.is_system),
  ),
)
const selected = computed(() => library.data.value?.find((t) => t.id === selectedId.value) ?? null)

async function remove(template: WorkoutTemplate): Promise<void> {
  const sure = await confirm({
    title: `Delete "${template.name}"?`,
    message: 'Sessions already in your plan keep their steps.',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (!sure) return
  await submit(() => templatesApi.remove(template.id))
  if (!error.value) {
    selectedId.value = null
    await library.run()
  }
}
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Workout library</h1>
        <p class="text-sm text-slate-600">
          The sessions your coach builds plans from. Your own workouts are preferred where they fit.
        </p>
      </div>
      <AppButton @click="router.push({ name: 'template-new' })">New workout</AppButton>
    </header>

    <div class="flex flex-wrap items-center gap-2">
      <div class="flex gap-1.5" role="group" aria-label="Sport">
        <button
          v-for="s in [
            { value: '', label: 'All' },
            { value: 'swim', label: 'Swim' },
            { value: 'bike', label: 'Bike' },
            { value: 'run', label: 'Run' },
          ]"
          :key="s.value"
          type="button"
          class="rounded-full px-3 py-1 text-sm ring-1"
          :class="
            sport === s.value
              ? 'bg-indigo-600 text-white ring-indigo-600'
              : 'bg-surface text-slate-700 ring-slate-300'
          "
          :aria-pressed="sport === s.value"
          @click="sport = s.value as Discipline | ''"
        >
          {{ s.label }}
        </button>
      </div>
      <select v-model="kind" class="rounded-md px-3 py-1.5 text-sm ring-1 ring-slate-300" aria-label="Kind">
        <option value="">Any kind</option>
        <option v-for="k in KINDS" :key="k.value" :value="k.value">{{ k.label }}</option>
      </select>
      <label class="flex items-center gap-2 text-sm text-slate-700">
        <input v-model="mineOnly" type="checkbox" class="size-4 rounded border-slate-300 text-indigo-600" />
        Only mine
      </label>
    </div>

    <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>

    <LoadingState :loading="library.loading.value" :error="library.error.value" @retry="library.run">
      <div class="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <ul class="grid content-start gap-2 sm:grid-cols-2">
          <li v-for="t in templates" :key="t.id">
            <button
              type="button"
              class="w-full rounded-md bg-surface px-3 py-2 text-left shadow-xs ring-1 transition"
              :class="selectedId === t.id ? 'ring-2 ring-indigo-600' : 'ring-slate-200 hover:ring-indigo-300'"
              :aria-pressed="selectedId === t.id"
              @click="selectedId = t.id"
            >
              <span class="flex items-center justify-between gap-2">
                <span class="text-sm font-medium">{{ t.name }}</span>
                <span
                  v-if="!t.is_system"
                  class="rounded bg-emerald-100 px-1.5 text-[10px] font-semibold text-emerald-800 uppercase"
                  >Mine</span
                >
              </span>
              <span class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <SportBadge :sport="t.sport" />
                {{ kindLabel(t.kind) }} · {{ formatDuration(t.min_s) }}–{{ formatDuration(t.max_s) }}
              </span>
            </button>
          </li>
          <li v-if="templates.length === 0" class="text-sm text-slate-500">No workouts match.</li>
        </ul>

        <AppCard v-if="selected" :title="selected.name" class="lg:sticky lg:top-6 lg:self-start">
          <p v-if="selected.description" class="mb-3 text-sm text-slate-600">{{ selected.description }}</p>
          <dl class="mb-4 grid grid-cols-2 gap-2 text-sm">
            <dt class="text-slate-500">Kind</dt>
            <dd>{{ kindLabel(selected.kind) }}</dd>
            <dt class="text-slate-500">Phases</dt>
            <dd>{{ selected.phases.map(titleCase).join(', ') }}</dd>
            <dt class="text-slate-500">Race distances</dt>
            <dd>{{ selected.distances ? selected.distances.map(titleCase).join(', ') : 'Any' }}</dd>
            <dt class="text-slate-500">Length</dt>
            <dd>
              {{ formatDuration(selected.min_s) }} to {{ formatDuration(selected.max_s) }}, scaled to fit
            </dd>
          </dl>
          <WorkoutProfile :blocks="selected.structure.steps" :sport="selected.sport" class="mb-3" />
          <StepList :blocks="selected.structure.steps" />
          <div class="mt-4 flex flex-wrap gap-2">
            <template v-if="selected.is_system">
              <AppButton
                variant="secondary"
                @click="router.push({ name: 'template-new', query: { from: selected.id } })"
              >
                Copy and adapt
              </AppButton>
            </template>
            <template v-else>
              <AppButton
                variant="secondary"
                @click="router.push({ name: 'template-edit', params: { id: selected.id } })"
                >Edit</AppButton
              >
              <AppButton variant="ghost" @click="remove(selected)">Delete</AppButton>
            </template>
          </div>
        </AppCard>
        <p v-else class="hidden text-sm text-slate-500 lg:block">Pick a workout to see its steps.</p>
      </div>
    </LoadingState>
  </div>
</template>
