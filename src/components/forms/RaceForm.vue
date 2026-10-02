<script setup lang="ts">
import { computed, watch } from 'vue'
import type { RaceInput } from '@/api/types'
import AppField from '@/components/ui/AppField.vue'
import { RACE_DISTANCES, isTriathlon } from '@/utils/races'

/**
 * A race. Only a triathlon can be the A race a plan is built around; running
 * races sit inside the plan as B or C races.
 */
const props = defineProps<{
  errors?: Record<string, string | undefined>
  showPriority?: boolean
  triathlonOnly?: boolean
}>()
const race = defineModel<RaceInput>({ required: true })

const groups = computed(() =>
  props.triathlonOnly ? RACE_DISTANCES.filter((g) => g.group === 'Triathlon') : RACE_DISTANCES,
)
const running = computed(() => !isTriathlon(race.value.distance))

watch(
  () => race.value.distance,
  () => {
    if (running.value && race.value.priority === 'A') race.value.priority = 'B'
  },
)
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <AppField
      v-model="race.name"
      label="Race name"
      placeholder="Jurmala 70.3"
      required
      :error="errors?.name"
      class="sm:col-span-2"
    />
    <AppField v-slot="{ id }" label="Distance" :error="errors?.distance">
      <select
        :id="id"
        v-model="race.distance"
        class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
      >
        <optgroup v-for="g in groups" :key="g.group" :label="g.group">
          <option v-for="d in g.options" :key="d.value" :value="d.value">{{ d.label }}</option>
        </optgroup>
      </select>
    </AppField>
    <AppField v-model="race.date" label="Race date" type="date" required :error="errors?.date" />
    <AppField
      v-if="showPriority"
      v-slot="{ id }"
      label="Priority"
      :error="errors?.priority"
      :hint="
        running
          ? 'Running races fit inside your triathlon plan: a B race gets a run-focused lead-in, a mini-taper and recovery after.'
          : 'A races get a plan; B races a mini-taper; C races are trained through.'
      "
      class="sm:col-span-2"
    >
      <select
        :id="id"
        v-model="race.priority"
        class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
      >
        <option value="A" :disabled="running">
          A: the goal race{{ running ? ' (triathlons only)' : '' }}
        </option>
        <option value="B">B: important, with a mini-taper</option>
        <option value="C">C: training race</option>
      </select>
    </AppField>
  </div>
</template>
