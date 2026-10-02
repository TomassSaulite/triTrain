<script setup lang="ts">
import { METRICS, STEP_TYPES } from './labels'
import type { EditorStep } from './editor'

defineProps<{ label: string; canMoveUp: boolean; canMoveDown: boolean }>()
defineEmits<{ up: []; down: []; remove: [] }>()
const step = defineModel<EditorStep>({ required: true })

const control = 'rounded-md px-2 py-1.5 text-sm ring-1 ring-slate-300'
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2 rounded-md bg-surface p-2 ring-1 ring-slate-200"
    role="group"
    :aria-label="label"
  >
    <select v-model="step.type" :class="control" aria-label="Step type">
      <option v-for="t in STEP_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
    </select>
    <input
      v-model.number="step.amount"
      type="number"
      min="0"
      step="any"
      :class="[control, 'w-20']"
      aria-label="Length"
    />
    <select v-model="step.measure" :class="control" aria-label="Unit">
      <option value="time">min</option>
      <option value="distance">m</option>
    </select>
    <template v-if="step.type !== 'rest'">
      <span class="text-sm text-slate-500">at</span>
      <input
        v-model.number="step.low"
        type="number"
        min="1"
        max="200"
        :class="[control, 'w-16']"
        aria-label="Target from (%)"
      />
      <span class="text-sm text-slate-500">–</span>
      <input
        v-model.number="step.high"
        type="number"
        min="1"
        max="200"
        :class="[control, 'w-16']"
        aria-label="Target to (%)"
      />
      <select v-model="step.metric" :class="control" aria-label="Target">
        <option v-for="m in METRICS" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
    </template>
    <div class="ml-auto flex gap-1">
      <button
        type="button"
        class="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        :disabled="!canMoveUp"
        :aria-label="`Move ${label} up`"
        @click="$emit('up')"
      >
        ↑
      </button>
      <button
        type="button"
        class="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
        :disabled="!canMoveDown"
        :aria-label="`Move ${label} down`"
        @click="$emit('down')"
      >
        ↓
      </button>
      <button
        type="button"
        class="rounded px-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
        :aria-label="`Remove ${label}`"
        @click="$emit('remove')"
      >
        ✕
      </button>
    </div>
  </div>
</template>
