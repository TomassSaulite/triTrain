<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { WeekProgress } from '@/api/types'
import { formatDate } from '@/utils/dates'
import { formatTss } from '@/utils/format'

/**
 * Planned versus done training load per week, as paired bars on one axis.
 */
const props = defineProps<{ weeks: WeekProgress[]; currentWeek?: string }>()
const emit = defineEmits<{ select: [week: WeekProgress] }>()

const root = ref<HTMLElement | null>(null)
const width = ref(720)
const hover = ref<number | null>(null)
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!root.value) return
  width.value = root.value.clientWidth || width.value
  observer = new ResizeObserver(([entry]) => (width.value = Math.max(280, entry.contentRect.width)))
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

const HEIGHT = 180
const PAD = { left: 36, right: 8, top: 10, bottom: 20 }

const step = computed(() => {
  const max = Math.max(1, ...props.weeks.flatMap((w) => [w.planned.tss, w.actual.tss]))
  return [50, 100, 200, 250, 500].find((s) => max / s <= 4) ?? 1000
})
const max = computed(() => {
  const top = Math.max(1, ...props.weeks.flatMap((w) => [w.planned.tss, w.actual.tss]))
  return Math.ceil(top / step.value) * step.value
})
const ticks = computed(() => Array.from({ length: max.value / step.value + 1 }, (_, i) => i * step.value))
const slot = computed(() => (width.value - PAD.left - PAD.right) / Math.max(1, props.weeks.length))
const barWidth = computed(() => Math.max(2, Math.min(14, (slot.value - 6) / 2)))
const y = (v: number) => PAD.top + (1 - v / max.value) * (HEIGHT - PAD.top - PAD.bottom)
const h = (v: number) => HEIGHT - PAD.bottom - y(v)
const center = (i: number) => PAD.left + slot.value * (i + 0.5)

const hovered = computed(() => (hover.value === null ? null : props.weeks[hover.value]))
</script>

<template>
  <div ref="root" class="weekly-load relative">
    <div class="mb-2 flex flex-wrap gap-4 text-xs text-slate-600">
      <span class="inline-flex items-center gap-1.5"
        ><span class="size-2.5 rounded-sm bg-(--planned)" />Planned</span
      >
      <span class="inline-flex items-center gap-1.5"
        ><span class="size-2.5 rounded-sm bg-(--done)" />Done</span
      >
      <span class="text-slate-500">Recovery weeks are marked R.</span>
    </div>
    <svg
      :width="width"
      :height="HEIGHT"
      role="img"
      aria-label="Planned and done training load per week"
      @pointerleave="hover = null"
    >
      <g class="text-[10px]" fill="var(--chart-muted)">
        <g v-for="t in ticks" :key="t">
          <line :x1="PAD.left" :x2="width - PAD.right" :y1="y(t)" :y2="y(t)" stroke="var(--chart-grid)" />
          <text :x="PAD.left - 6" :y="y(t) + 3" text-anchor="end">{{ t }}</text>
        </g>
      </g>
      <g
        v-for="(week, i) in weeks"
        :key="week.start_date"
        class="cursor-pointer"
        @pointerenter="hover = i"
        @click="emit('select', week)"
      >
        <rect
          :x="center(i) - slot / 2"
          :y="PAD.top"
          :width="slot"
          :height="HEIGHT - PAD.top - PAD.bottom"
          :fill="hover === i ? 'var(--chart-grid)' : 'transparent'"
        />
        <rect
          :x="center(i) - barWidth - 1"
          :y="y(week.planned.tss)"
          :width="barWidth"
          :height="h(week.planned.tss)"
          rx="2"
          fill="var(--planned)"
        />
        <rect
          v-if="week.actual.tss > 0"
          :x="center(i) + 1"
          :y="y(week.actual.tss)"
          :width="barWidth"
          :height="h(week.actual.tss)"
          rx="2"
          fill="var(--done)"
        />
        <text
          v-if="week.is_recovery"
          :x="center(i)"
          :y="HEIGHT - 6"
          text-anchor="middle"
          class="text-[9px]"
          fill="var(--chart-muted)"
        >
          R
        </text>
        <rect
          v-if="week.start_date === currentWeek"
          :x="center(i) - slot / 2 + 1"
          :y="HEIGHT - PAD.bottom + 2"
          :width="slot - 2"
          height="2"
          fill="var(--color-indigo-600)"
        />
      </g>
    </svg>
    <div
      v-if="hovered && hover !== null"
      class="pointer-events-none absolute top-6 w-44 rounded-md bg-surface px-3 py-2 text-xs shadow-md ring-1 ring-slate-200"
      :style="{ left: `${Math.min(center(hover) + 10, width - 180)}px` }"
    >
      <p class="font-medium">
        Week of {{ formatDate(hovered.start_date, { day: 'numeric', month: 'short' }) }}
      </p>
      <p class="text-slate-500 capitalize">
        {{ hovered.phase }}{{ hovered.is_recovery ? ' · recovery' : '' }}
      </p>
      <dl class="mt-1 grid grid-cols-[1fr_auto] gap-x-2">
        <dt>Planned</dt>
        <dd class="text-right tabular-nums">{{ formatTss(hovered.planned.tss) }} TSS</dd>
        <dt>Done</dt>
        <dd class="text-right tabular-nums">{{ formatTss(hovered.actual.tss) }} TSS</dd>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.weekly-load {
  /* Categorical slots 1 and 2 of the validated reference palette; dark steps come from the theme. */
  --planned: var(--chart-1);
  --done: var(--chart-2);
}
</style>
