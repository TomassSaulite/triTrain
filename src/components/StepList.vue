<script setup lang="ts">
import type { StructureBlock } from '@/api/types'
import {
  formatDistance,
  formatDuration,
  formatRelativeTarget,
  formatResolvedTarget,
  titleCase,
} from '@/utils/format'

/** A workout's steps, with repeats nested, showing absolute targets when known. */
defineProps<{ blocks: StructureBlock[] }>()
</script>

<template>
  <ol class="space-y-1.5">
    <li v-for="(block, i) in blocks" :key="i">
      <div v-if="block.type === 'repeat'" class="rounded-md bg-slate-50 p-2 ring-1 ring-slate-200">
        <p class="mb-1.5 text-xs font-semibold tracking-wide text-slate-600 uppercase">{{ block.count }} ×</p>
        <StepList :blocks="block.steps" />
      </div>
      <div
        v-else
        class="flex flex-wrap items-baseline justify-between gap-x-3 rounded-md bg-surface px-3 py-2 ring-1 ring-slate-200"
      >
        <p class="text-sm">
          <span class="font-medium">{{ titleCase(block.type) }}</span>
          <span class="text-slate-600">
            ·
            {{ block.distance_m ? formatDistance(block.distance_m) : formatDuration(block.duration_s ?? 0) }}
          </span>
        </p>
        <p v-if="block.target" class="text-sm tabular-nums">
          <span v-if="block.resolved" class="font-medium">{{ formatResolvedTarget(block.resolved) }}</span>
          <span class="ml-2 text-xs text-slate-500">{{ formatRelativeTarget(block.target) }}</span>
        </p>
        <p v-else class="text-sm text-slate-500">Rest</p>
      </div>
    </li>
  </ol>
</template>
