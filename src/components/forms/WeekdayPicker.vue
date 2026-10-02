<script setup lang="ts">
import { computed } from 'vue'
import type { Weekday } from '@/api/types'
import { WEEKDAYS } from '@/utils/dates'

/**
 * Toggle buttons for weekdays: pick one (v-model a weekday or null) or
 * several (v-model an array).
 */
const props = defineProps<{
  label: string
  multiple?: boolean
  allowNone?: boolean
  noneLabel?: string
  disabledDays?: number[]
}>()
const model = defineModel<Weekday[] | Weekday | null>({ required: true })

const selected = computed(() =>
  Array.isArray(model.value) ? model.value : model.value === null ? [] : [model.value],
)

function toggle(day: Weekday): void {
  if (props.multiple) {
    const days = selected.value.includes(day)
      ? selected.value.filter((d) => d !== day)
      : [...selected.value, day]
    model.value = days.sort((a, b) => a - b)
  } else {
    model.value = props.allowNone && model.value === day ? null : day
  }
}
</script>

<template>
  <fieldset>
    <legend class="text-sm font-medium text-slate-700">{{ label }}</legend>
    <div class="mt-1 flex flex-wrap gap-1.5">
      <button
        v-for="day in WEEKDAYS"
        :key="day.value"
        type="button"
        :aria-pressed="selected.includes(day.value)"
        :disabled="disabledDays?.includes(day.value)"
        class="w-12 rounded-md py-1.5 text-sm font-medium ring-1 transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="
          selected.includes(day.value)
            ? 'bg-indigo-600 text-white ring-indigo-600'
            : 'bg-surface text-slate-700 ring-slate-300 hover:bg-slate-50'
        "
        @click="toggle(day.value)"
      >
        {{ day.short }}
      </button>
      <button
        v-if="allowNone && !multiple"
        type="button"
        :aria-pressed="model === null"
        class="rounded-md px-3 py-1.5 text-sm font-medium ring-1"
        :class="
          model === null
            ? 'bg-indigo-600 text-white ring-indigo-600'
            : 'bg-surface text-slate-700 ring-slate-300'
        "
        @click="model = null"
      >
        {{ noneLabel ?? 'Auto' }}
      </button>
    </div>
  </fieldset>
</template>
