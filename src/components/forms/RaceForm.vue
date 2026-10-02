<script setup lang="ts">
import AppField from '@/components/ui/AppField.vue'
import type { RaceInput } from '@/api/types'

defineProps<{ errors?: Record<string, string | undefined>; showPriority?: boolean }>()
const race = defineModel<RaceInput>({ required: true })

const distances = [
  { value: 'sprint', label: 'Sprint' },
  { value: 'olympic', label: 'Olympic' },
  { value: 'half', label: 'Half (70.3)' },
  { value: 'full', label: 'Full (Ironman)' },
] as const
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
        <option v-for="d in distances" :key="d.value" :value="d.value">{{ d.label }}</option>
      </select>
    </AppField>
    <AppField v-model="race.date" label="Race date" type="date" required :error="errors?.date" />
    <AppField
      v-if="showPriority"
      v-slot="{ id }"
      label="Priority"
      :error="errors?.priority"
      hint="A races get a plan; B races a mini-taper; C races are trained through."
      class="sm:col-span-2"
    >
      <select
        :id="id"
        v-model="race.priority"
        class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
      >
        <option value="A">A: the goal race</option>
        <option value="B">B: important, with a mini-taper</option>
        <option value="C">C: training race</option>
      </select>
    </AppField>
  </div>
</template>
