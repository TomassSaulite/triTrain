<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { FeedbackEntry, FeelDimension } from '@/api/types'
import { addDays, daysBetween, formatDate } from '@/utils/dates'
import { FEEL_SCALES, levelLabel, rpeLabel } from '@/utils/feel'
import { SPORTS } from '@/utils/sports'

/**
 * How sessions have felt over time: one small chart per measure (effort,
 * muscles, breathing, energy, mood), stacked on a shared date axis. Each has
 * its own scale, so they never share a y axis. Dots are single sessions; the
 * line is the average of the last five ratings. Higher is always harder.
 */
const props = defineProps<{ entries: FeedbackEntry[]; days: number; today: string }>()

type Measure = 'rpe' | FeelDimension

const PANELS: { key: Measure; label: string; max: number; low: string; high: string }[] = [
  { key: 'rpe', label: 'Effort', max: 10, low: 'Very easy', high: 'Maximal' },
  ...FEEL_SCALES.map((s) => ({ key: s.key, label: s.label, max: 5, low: s.levels[0], high: s.levels[4] })),
]

const ROLLING = 5
const PANEL_HEIGHT = 64
const TITLE_HEIGHT = 26
const PANEL_GAP = 14
const AXIS_HEIGHT = 20
const PAD = { left: 72, right: 52 }

const root = ref<HTMLElement | null>(null)
const width = ref(640)
const hover = ref<number | null>(null)
const showTable = ref(false)
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!root.value) return
  width.value = root.value.clientWidth || width.value
  observer = new ResizeObserver(([entry]) => (width.value = Math.max(280, entry.contentRect.width)))
  observer.observe(root.value)
})
onBeforeUnmount(() => observer?.disconnect())

/** The axis starts at the first rating (with a little room), not at an empty stretch. */
const from = computed(() => {
  const windowStart = addDays(props.today, 1 - props.days)
  const first = props.entries[0]?.date
  return first && first > windowStart ? addDays(first, -2) : windowStart
})
const span = computed(() => Math.max(1, daysBetween(from.value, props.today)))
const plotWidth = computed(() => width.value - PAD.left - PAD.right)
const x = (date: string) => PAD.left + (daysBetween(from.value, date) / span.value) * plotWidth.value
const panelTop = (i: number) => i * (PANEL_HEIGHT + TITLE_HEIGHT + PANEL_GAP) + TITLE_HEIGHT
const y = (i: number, value: number, max: number) =>
  panelTop(i) + (1 - (value - 1) / (max - 1)) * (PANEL_HEIGHT - 8) + 4
const height = computed(
  () => PANELS.length * (PANEL_HEIGHT + TITLE_HEIGHT + PANEL_GAP) - PANEL_GAP + AXIS_HEIGHT,
)

/** Per measure: the rated sessions and the trailing average after each. */
const series = computed(() =>
  PANELS.map((panel) => {
    const points = props.entries
      .map((e, index) => ({ index, date: e.date, value: e[panel.key] }))
      .filter((p): p is { index: number; date: string; value: number } => p.value !== null)
    const average = points.map((p, i) => {
      const window = points.slice(Math.max(0, i - ROLLING + 1), i + 1)
      return { date: p.date, value: window.reduce((sum, w) => sum + w.value, 0) / window.length }
    })

    return { ...panel, points, average }
  }),
)

const path = (i: number, max: number, points: { date: string; value: number }[]) =>
  points.map((p, k) => `${k ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(i, p.value, max).toFixed(1)}`).join('')

const xTicks = computed(() => {
  const count = Math.max(2, Math.min(5, Math.floor(plotWidth.value / 90) + 1))
  return Array.from({ length: count }, (_, k) =>
    addDays(from.value, Math.round((k / (count - 1)) * span.value)),
  )
})

function onMove(event: PointerEvent): void {
  if (props.entries.length === 0) return
  const left = (event.currentTarget as SVGElement).getBoundingClientRect().left
  const px = event.clientX - left
  let best = 0
  props.entries.forEach((e, i) => {
    if (Math.abs(x(e.date) - px) < Math.abs(x(props.entries[best].date) - px)) best = i
  })
  hover.value = best
}

const hovered = computed(() => (hover.value === null ? null : props.entries[hover.value]))
const tooltipLeft = computed(() => {
  if (!hovered.value) return 0
  const px = x(hovered.value.date)
  return px > width.value - 220 ? px - 210 : px + 12
})

const summary = computed(
  () =>
    `How ${props.entries.length} rated sessions felt over the last ${props.days} days. Use the table for the values.`,
)

const latestWord = (key: Measure, value: number) =>
  (key === 'rpe' ? rpeLabel(value) : levelLabel(key, value)).toLowerCase()

const describe = (key: Measure, value: number | null) =>
  value === null ? '–' : `${value} · ${key === 'rpe' ? rpeLabel(value) : levelLabel(key, value)}`
</script>

<template>
  <div ref="root" class="feel-trends relative">
    <div class="mb-2 flex items-center gap-3 text-xs text-slate-600">
      <span class="inline-flex items-center gap-1.5"
        ><span class="size-2 rounded-full bg-(--dot)" />One session</span
      >
      <span class="inline-flex items-center gap-1.5"
        ><span class="h-0.5 w-4 rounded bg-(--line)" />Average of the last {{ ROLLING }}</span
      >
      <button class="ml-auto text-indigo-600 hover:underline" type="button" @click="showTable = !showTable">
        {{ showTable ? 'Show charts' : 'Show table' }}
      </button>
    </div>

    <p v-if="entries.length === 0" class="py-10 text-center text-sm text-slate-500">
      Rate a few sessions to see how training has been feeling.
    </p>

    <template v-else-if="!showTable">
      <svg
        :width="width"
        :height="height"
        role="img"
        :aria-label="summary"
        class="touch-none select-none"
        @pointermove="onMove"
        @pointerleave="hover = null"
      >
        <g v-for="(s, i) in series" :key="s.key">
          <text :x="0" :y="panelTop(i) - 10" class="text-xs" fill="var(--text)">
            <tspan font-weight="600">{{ s.label }}</tspan>
            <tspan v-if="s.average.length" fill="var(--muted)">
              · lately {{ latestWord(s.key, s.average.at(-1)!.value) }}
            </tspan>
          </text>
          <line
            :x1="PAD.left"
            :x2="width - PAD.right"
            :y1="y(i, 1, s.max)"
            :y2="y(i, 1, s.max)"
            stroke="var(--axis)"
          />
          <line
            :x1="PAD.left"
            :x2="width - PAD.right"
            :y1="y(i, s.max, s.max)"
            :y2="y(i, s.max, s.max)"
            stroke="var(--grid)"
          />
          <g class="text-[10px]" fill="var(--muted)">
            <text :x="PAD.left - 6" :y="y(i, s.max, s.max) + 3" text-anchor="end">{{ s.high }}</text>
            <text :x="PAD.left - 6" :y="y(i, 1, s.max) + 3" text-anchor="end">{{ s.low }}</text>
          </g>
          <circle
            v-for="p in s.points"
            :key="p.index"
            :cx="x(p.date)"
            :cy="y(i, p.value, s.max)"
            r="4"
            fill="var(--dot)"
            stroke="var(--surface)"
            stroke-width="2"
          />
          <path
            v-if="s.average.length > 1"
            :d="path(i, s.max, s.average)"
            fill="none"
            stroke="var(--line)"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <text
            v-if="s.average.length"
            :x="width - PAD.right + 8"
            :y="y(i, s.average.at(-1)!.value, s.max) + 3"
            class="text-[11px]"
            fill="var(--text)"
          >
            {{ s.average.at(-1)!.value.toFixed(1) }}
          </text>
        </g>

        <g class="text-[10px]" fill="var(--muted)">
          <text
            v-for="(d, k) in xTicks"
            :key="d"
            :x="x(d)"
            :y="height - 4"
            :text-anchor="k === 0 ? 'start' : k === xTicks.length - 1 ? 'end' : 'middle'"
          >
            {{ formatDate(d, { day: 'numeric', month: 'short' }) }}
          </text>
        </g>

        <g v-if="hovered" pointer-events="none">
          <line
            :x1="x(hovered.date)"
            :x2="x(hovered.date)"
            :y1="TITLE_HEIGHT"
            :y2="height - AXIS_HEIGHT"
            stroke="var(--axis)"
          />
          <template v-for="(s, i) in series" :key="s.key">
            <circle
              v-if="hovered[s.key] !== null"
              :cx="x(hovered.date)"
              :cy="y(i, hovered[s.key]!, s.max)"
              r="5"
              fill="var(--line)"
              stroke="var(--surface)"
              stroke-width="2"
            />
          </template>
        </g>
      </svg>

      <div
        v-if="hovered"
        class="pointer-events-none absolute top-6 w-52 rounded-md bg-white px-3 py-2 text-xs shadow-md ring-1 ring-slate-200"
        :style="{ left: `${tooltipLeft}px` }"
      >
        <p class="font-medium text-slate-900">
          {{ formatDate(hovered.date) }} · {{ hovered.activity_name ?? SPORTS[hovered.sport].label }}
        </p>
        <dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-2 text-slate-700">
          <template v-for="s in series" :key="s.key">
            <dt class="text-slate-500">{{ s.label }}</dt>
            <dd class="text-right">{{ describe(s.key, hovered[s.key]) }}</dd>
          </template>
        </dl>
        <p v-if="hovered.pain" class="mt-1 text-rose-700">
          Pain{{ hovered.pain_area ? `: ${hovered.pain_area}` : '' }}
        </p>
        <p v-if="hovered.note" class="mt-1 text-slate-600 italic">{{ hovered.note }}</p>
      </div>
    </template>

    <div v-else class="max-h-80 overflow-auto">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-white text-left text-xs text-slate-500">
          <tr>
            <th class="py-1 font-medium">Date</th>
            <th class="py-1 font-medium">Session</th>
            <th v-for="s in series" :key="s.key" class="py-1 font-medium">{{ s.label }}</th>
            <th class="py-1 font-medium">Pain</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in [...entries].reverse()" :key="e.id" class="border-t border-slate-100">
            <td class="py-1 whitespace-nowrap">{{ formatDate(e.date) }}</td>
            <td class="py-1">{{ e.activity_name ?? SPORTS[e.sport].label }}</td>
            <td v-for="s in series" :key="s.key" class="py-1 whitespace-nowrap">
              {{ describe(s.key, e[s.key]) }}
            </td>
            <td class="py-1">{{ e.pain ? (e.pain_area ?? 'Yes') : '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.feel-trends {
  /* Slot 1 of the validated reference palette (light): one measure per chart. */
  --line: #2a78d6;
  --dot: #9cc0ec;
  --surface: #ffffff;
  --text: #334155;
  --muted: #64748b;
  --grid: #eef0f3;
  --axis: #cbd5e1;
}
</style>
