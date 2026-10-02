<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Threshold, ThresholdMetric } from '@/api/types'
import { daysBetween, formatDate, today } from '@/utils/dates'
import { THRESHOLD_METRICS, formatThreshold, titleCase } from '@/utils/format'

/**
 * How one threshold changed over time. The value holds from one test to the
 * next, so the line steps at each test and runs on to today. For paces a
 * lower number is better, so that axis is flipped: up always means fitter.
 */
const props = defineProps<{
  metric: ThresholdMetric
  history: Threshold[]
  /** A shared first date, so side-by-side charts line up in time. */
  start?: string
}>()

const HEIGHT = 120
const PAD = { left: 48, right: 64, top: 10, bottom: 22 }

const root = ref<HTMLElement | null>(null)
const width = ref(320)
const hover = ref<number | null>(null)
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!root.value) return
  width.value = root.value.clientWidth || width.value
  observer = new ResizeObserver(([entry]) => (width.value = Math.max(240, entry.contentRect.width)))
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

const info = computed(() => THRESHOLD_METRICS[props.metric])
/** Oldest first. */
const points = computed(() =>
  [...props.history].sort((a, b) => a.tested_at.localeCompare(b.tested_at) || a.id - b.id),
)
const first = computed(() => props.start ?? points.value[0]?.tested_at ?? today())
const span = computed(() => Math.max(1, daysBetween(first.value, today())))
const x = (date: string) =>
  PAD.left + (daysBetween(first.value, date) / span.value) * (width.value - PAD.left - PAD.right)

const extent = computed(() => {
  const values = points.value.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max((max - min) * 0.15, max * 0.02)
  return { min: min - pad, max: max + pad }
})
/** Fitter is up: higher watts and heart rate, lower (faster) paces. */
const y = (value: number) => {
  const { min, max } = extent.value
  const share = (value - min) / (max - min || 1)
  return PAD.top + (info.value.isPace ? share : 1 - share) * (HEIGHT - PAD.top - PAD.bottom)
}

const path = computed(() => {
  const ps = points.value
  if (ps.length === 0) return ''
  let d = `M${x(ps[0].tested_at)},${y(ps[0].value)}`
  for (let i = 1; i < ps.length; i++) {
    d += `H${x(ps[i].tested_at)}V${y(ps[i].value)}`
  }
  return d + `H${x(today())}`
})

const latest = computed(() => points.value.at(-1))
const change = computed(() => {
  const ps = points.value
  if (ps.length < 2) return null
  const delta = ps.at(-1)!.value - ps[0].value
  const better = info.value.isPace ? delta < 0 : delta > 0
  return { delta, better }
})

function onMove(event: PointerEvent): void {
  const left = (event.currentTarget as SVGElement).getBoundingClientRect().left
  const px = event.clientX - left
  let best = 0
  points.value.forEach((p, i) => {
    if (Math.abs(x(p.tested_at) - px) < Math.abs(x(points.value[best].tested_at) - px)) best = i
  })
  hover.value = points.value.length ? best : null
}

const hovered = computed(() => (hover.value === null ? null : points.value[hover.value]))
const tooltipLeft = computed(() => {
  if (!hovered.value) return 0
  const px = x(hovered.value.tested_at)
  return px > width.value - 180 ? px - 170 : px + 10
})

const summary = computed(() => {
  const l = latest.value
  if (!l) return `No ${info.value.label} recorded yet.`
  return `${info.value.label}: ${points.value.length} values from ${formatDate(first.value)}; now ${formatThreshold(props.metric, l.value)}.`
})
</script>

<template>
  <figure ref="root" class="threshold-history relative">
    <figcaption class="mb-1 flex items-baseline justify-between gap-2 text-sm">
      <span class="font-medium text-slate-800">{{ info.label }}</span>
      <span v-if="change" class="text-xs" :class="change.better ? 'text-emerald-700' : 'text-slate-500'">
        {{ change.better ? 'Improved' : 'Changed' }}
        {{ formatThreshold(metric, points[0].value) }} → {{ formatThreshold(metric, latest!.value) }}
      </span>
    </figcaption>
    <svg
      :width="width"
      :height="HEIGHT"
      role="img"
      :aria-label="summary"
      class="touch-none select-none"
      @pointermove="onMove"
      @pointerleave="hover = null"
    >
      <g class="text-[10px]" fill="var(--muted)">
        <line
          :x1="PAD.left"
          :x2="width - PAD.right"
          :y1="HEIGHT - PAD.bottom"
          :y2="HEIGHT - PAD.bottom"
          stroke="var(--axis)"
        />
        <text :x="PAD.left - 6" :y="PAD.top + 8" text-anchor="end">
          {{ info.isPace ? 'faster' : 'higher' }}
        </text>
        <text :x="PAD.left - 6" :y="HEIGHT - PAD.bottom - 2" text-anchor="end">
          {{ info.isPace ? 'slower' : 'lower' }}
        </text>
        <text :x="PAD.left" :y="HEIGHT - 6">{{ formatDate(first, { day: 'numeric', month: 'short' }) }}</text>
        <text :x="width - PAD.right" :y="HEIGHT - 6" text-anchor="end">Today</text>
      </g>
      <path :d="path" fill="none" stroke="var(--line)" stroke-width="2" stroke-linejoin="round" />
      <circle
        v-for="p in points"
        :key="p.id"
        :cx="x(p.tested_at)"
        :cy="y(p.value)"
        r="4"
        :fill="p.source === 'test' ? 'var(--line)' : 'var(--surface)'"
        stroke="var(--line)"
        stroke-width="2"
      />
      <text
        v-if="latest"
        :x="width - PAD.right + 8"
        :y="y(latest.value) + 4"
        class="text-[11px] font-medium"
        fill="var(--text)"
      >
        {{ formatThreshold(metric, latest.value) }}
      </text>
      <circle
        v-if="hovered"
        :cx="x(hovered.tested_at)"
        :cy="y(hovered.value)"
        r="6"
        fill="none"
        stroke="var(--line)"
        stroke-width="2"
        pointer-events="none"
      />
    </svg>
    <div
      v-if="hovered"
      class="pointer-events-none absolute top-6 w-40 rounded-md bg-white px-3 py-2 text-xs shadow-md ring-1 ring-slate-200"
      :style="{ left: `${tooltipLeft}px` }"
    >
      <p class="font-medium text-slate-900">{{ formatThreshold(metric, hovered.value) }}</p>
      <p class="text-slate-600">{{ formatDate(hovered.tested_at) }} · {{ titleCase(hovered.source) }}</p>
    </div>
  </figure>
</template>

<style scoped>
.threshold-history {
  /* Slot 1 of the validated reference palette; dark values come from the theme. */
  --line: var(--chart-1);
  --surface: var(--chart-surface);
  --text: var(--chart-text);
  --muted: var(--chart-muted);
  --axis: var(--chart-axis);
}
</style>
