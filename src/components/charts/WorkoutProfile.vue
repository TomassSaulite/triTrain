<script setup lang="ts">
import { computed } from 'vue'
import type { Sport, Step, StructureBlock } from '@/api/types'
import { formatDuration, formatRelativeTarget } from '@/utils/format'

/**
 * The shape of a timed workout: one block per step, as wide as it lasts and
 * as tall as it is hard (relative to threshold). Distance-based workouts
 * (swims) have no fixed duration and are not drawn.
 */
const props = defineProps<{ blocks: StructureBlock[]; sport: Sport }>()

function flatten(blocks: StructureBlock[]): Step[] {
  return blocks.flatMap((b) =>
    b.type === 'repeat' ? Array.from({ length: b.count }, () => flatten(b.steps)).flat() : [b],
  )
}

const steps = computed(() => flatten(props.blocks))
const drawable = computed(() => steps.value.length > 0 && steps.value.every((s) => s.duration_s))
const total = computed(() => steps.value.reduce((sum, s) => sum + (s.duration_s ?? 0), 0))

const HEIGHT = 64
const intensity = (s: Step) => (s.target ? (s.target.low + s.target.high) / 2 : 0.3)

const bars = computed(() => {
  let offset = 0

  return steps.value.map((step) => {
    const width = ((step.duration_s ?? 0) / total.value) * 100
    const height = Math.min(1, intensity(step) / 1.2) * HEIGHT
    const bar = { x: offset, width, height, step }
    offset += width

    return bar
  })
})
</script>

<template>
  <figure v-if="drawable" class="w-full">
    <svg
      :viewBox="`0 0 100 ${HEIGHT}`"
      preserveAspectRatio="none"
      class="h-16 w-full"
      role="img"
      :aria-label="`Workout profile, ${formatDuration(total)}`"
    >
      <line
        x1="0"
        x2="100"
        :y1="HEIGHT - HEIGHT / 1.2"
        :y2="HEIGHT - HEIGHT / 1.2"
        stroke="#cbd5e1"
        stroke-dasharray="1 1"
        vector-effect="non-scaling-stroke"
      />
      <rect
        v-for="(bar, i) in bars"
        :key="i"
        :x="bar.x"
        :y="HEIGHT - bar.height"
        :width="Math.max(bar.width - 0.15, 0.1)"
        :height="bar.height"
        :fill="`var(--color-${sport === 'brick' ? 'bike' : sport})`"
        :fill-opacity="0.35 + 0.65 * Math.min(1, intensity(bar.step))"
      >
        <title>
          {{ formatDuration(bar.step.duration_s ?? 0)
          }}{{ bar.step.target ? ` at ${formatRelativeTarget(bar.step.target)}` : '' }}
        </title>
      </rect>
    </svg>
    <figcaption class="mt-1 flex justify-between text-xs text-slate-500">
      <span>0</span>
      <span>Dashed line: threshold</span>
      <span>{{ formatDuration(total) }}</span>
    </figcaption>
  </figure>
</template>
