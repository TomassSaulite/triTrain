<script setup lang="ts">
import type { PlannedWorkout } from '@/api/types'
import { formatDuration, formatTss, titleCase } from '@/utils/format'
import { SPORTS } from '@/utils/sports'
import StatusBadge from './StatusBadge.vue'

defineProps<{ workout: PlannedWorkout; compact?: boolean }>()
</script>

<template>
  <RouterLink
    :to="{ name: 'workout', params: { id: workout.id } }"
    class="block rounded-md border-l-4 bg-white px-3 py-2 shadow-xs ring-1 ring-slate-200 transition hover:ring-indigo-300"
    :class="{ 'opacity-60': workout.status === 'dropped' }"
    :style="{ borderLeftColor: `var(--color-${workout.sport})` }"
  >
    <div class="flex items-start justify-between gap-2">
      <p class="text-sm leading-snug font-medium text-slate-900">
        <span class="sr-only">{{ SPORTS[workout.sport].label }}: </span>{{ workout.title }}
      </p>
      <span
        v-if="workout.is_key"
        class="shrink-0 rounded bg-indigo-50 px-1.5 text-[10px] font-semibold text-indigo-700 uppercase"
      >
        Key
      </span>
    </div>
    <p class="mt-0.5 text-xs text-slate-500">
      {{ formatDuration(workout.target_duration_s) }} · {{ formatTss(workout.target_tss) }} TSS
      <template v-if="!compact"> · {{ titleCase(workout.kind) }}</template>
    </p>
    <StatusBadge v-if="workout.status !== 'planned'" :status="workout.status" class="mt-1 inline-block" />
  </RouterLink>
</template>
