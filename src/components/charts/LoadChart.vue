<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { DailyLoad } from '@/api/types'
import { formatDate } from '@/utils/dates'

/**
 * Fitness (CTL) and fatigue (ATL) on one chart, form (TSB) on its own below:
 * they are different measures, so they never share an axis. Both panels
 * share the x axis and one hover crosshair.
 */
const props = defineProps<{ points: DailyLoad[] }>()

const root = ref<HTMLElement | null>(null)
const width = ref(640)
const hover = ref<number | null>(null)
const showTable = ref(false)

const MAIN_HEIGHT = 200
const FORM_HEIGHT = 90
const PAD = { left: 36, right: 84, top: 12, bottom: 22 }

let observer: ResizeObserver | null = null

onMounted(() => {
  if (!root.value) return
  width.value = root.value.clientWidth || width.value
  observer = new ResizeObserver(([entry]) => (width.value = Math.max(280, entry.contentRect.width)))
  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())

const plotWidth = computed(() => width.value - PAD.left - PAD.right)
const x = (i: number) =>
  PAD.left + (props.points.length <= 1 ? 0 : (i / (props.points.length - 1)) * plotWidth.value)

/** A round step giving at most four intervals up to $value. */
function niceStep(value: number): number {
  return [5, 10, 20, 25, 50, 100].find((step) => value / step <= 4) ?? 200
}

function niceMax(value: number): number {
  const step = niceStep(value)
  return Math.max(step, Math.ceil(value / step) * step)
}

const mainMax = computed(() => niceMax(Math.max(...props.points.flatMap((p) => [p.ctl, p.atl]), 0) * 1.05))
const yMain = (v: number) => PAD.top + (1 - v / mainMax.value) * (MAIN_HEIGHT - PAD.top - PAD.bottom)
const mainTicks = computed(() => {
  const step = niceStep(mainMax.value)
  return Array.from({ length: mainMax.value / step + 1 }, (_, i) => i * step)
})

const formExtent = computed(() => {
  const values = props.points.map((p) => p.tsb)
  const bound = niceMax(Math.max(10, ...values.map(Math.abs)))
  return { min: -bound, max: bound }
})
const yForm = (v: number) =>
  8 + (1 - (v - formExtent.value.min) / (formExtent.value.max - formExtent.value.min)) * (FORM_HEIGHT - 16)

const path = (values: number[], y: (v: number) => number) =>
  values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')

const ctlPath = computed(() =>
  path(
    props.points.map((p) => p.ctl),
    yMain,
  ),
)
const atlPath = computed(() =>
  path(
    props.points.map((p) => p.atl),
    yMain,
  ),
)
const tsbPath = computed(() =>
  path(
    props.points.map((p) => p.tsb),
    yForm,
  ),
)
const tsbArea = computed(() =>
  props.points.length === 0
    ? ''
    : `${tsbPath.value}L${x(props.points.length - 1)},${yForm(0)}L${x(0)},${yForm(0)}Z`,
)

const last = computed(() => props.points.at(-1))
const xTicks = computed(() => {
  const n = props.points.length
  if (n < 2) return []
  // About one date label per 80px so they never collide on narrow screens.
  const count = Math.max(2, Math.min(5, n, Math.floor(plotWidth.value / 80) + 1))
  return Array.from({ length: count }, (_, k) => Math.round((k / (count - 1)) * (n - 1)))
})

function onMove(event: PointerEvent): void {
  const svg = event.currentTarget as SVGElement
  const left = svg.getBoundingClientRect().left
  const fraction = (event.clientX - left - PAD.left) / plotWidth.value
  hover.value = Math.min(
    props.points.length - 1,
    Math.max(0, Math.round(fraction * (props.points.length - 1))),
  )
}

const hovered = computed(() => (hover.value === null ? null : props.points[hover.value]))
const tooltipLeft = computed(() => {
  if (hover.value === null) return 0
  const px = x(hover.value)
  return px > width.value - 170 ? px - 160 : px + 12
})

const summary = computed(() =>
  last.value
    ? `Fitness ${Math.round(last.value.ctl)}, fatigue ${Math.round(last.value.atl)}, form ${Math.round(last.value.tsb)} on ${formatDate(last.value.date)}.`
    : 'No training load yet.',
)
</script>

<template>
  <div ref="root" class="load-chart relative">
    <div class="mb-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
      <span class="inline-flex items-center gap-1.5"
        ><span class="h-0.5 w-4 rounded bg-(--ctl)" />Fitness (CTL)</span
      >
      <span class="inline-flex items-center gap-1.5"
        ><span class="h-0.5 w-4 rounded bg-(--atl)" />Fatigue (ATL)</span
      >
      <button class="ml-auto text-indigo-600 hover:underline" type="button" @click="showTable = !showTable">
        {{ showTable ? 'Show chart' : 'Show table' }}
      </button>
    </div>

    <p v-if="points.length === 0" class="py-10 text-center text-sm text-slate-500">
      Log or sync a few activities to see your fitness here.
    </p>

    <template v-else-if="!showTable">
      <svg
        :width="width"
        :height="MAIN_HEIGHT + FORM_HEIGHT + 18"
        role="img"
        :aria-label="summary"
        class="touch-none select-none"
        @pointermove="onMove"
        @pointerleave="hover = null"
      >
        <g class="text-[10px]" fill="var(--muted)">
          <g v-for="tick in mainTicks" :key="tick">
            <line
              :x1="PAD.left"
              :x2="width - PAD.right"
              :y1="yMain(tick)"
              :y2="yMain(tick)"
              stroke="var(--grid)"
            />
            <text :x="PAD.left - 6" :y="yMain(tick) + 3" text-anchor="end">{{ tick }}</text>
          </g>
        </g>
        <path :d="atlPath" fill="none" stroke="var(--atl)" stroke-width="2" stroke-linejoin="round" />
        <path :d="ctlPath" fill="none" stroke="var(--ctl)" stroke-width="2" stroke-linejoin="round" />
        <template v-if="last">
          <text :x="width - PAD.right + 8" :y="yMain(last.ctl) + 4" class="text-[11px]" fill="var(--text)">
            Fitness {{ Math.round(last.ctl) }}
          </text>
          <text
            :x="width - PAD.right + 8"
            :y="yMain(last.atl) + (last.atl > last.ctl ? -6 : 14)"
            class="text-[11px]"
            fill="var(--text)"
          >
            Fatigue {{ Math.round(last.atl) }}
          </text>
        </template>

        <g :transform="`translate(0, ${MAIN_HEIGHT})`">
          <text :x="PAD.left" y="4" class="text-[11px]" fill="var(--text)">Form (TSB)</text>
          <line :x1="PAD.left" :x2="width - PAD.right" :y1="yForm(0)" :y2="yForm(0)" stroke="var(--axis)" />
          <text
            :x="PAD.left - 6"
            :y="yForm(formExtent.max) + 3"
            text-anchor="end"
            class="text-[10px]"
            fill="var(--muted)"
          >
            +{{ formExtent.max }}
          </text>
          <text :x="PAD.left - 6" :y="yForm(0) + 3" text-anchor="end" class="text-[10px]" fill="var(--muted)">
            0
          </text>
          <text
            :x="PAD.left - 6"
            :y="yForm(formExtent.min) + 3"
            text-anchor="end"
            class="text-[10px]"
            fill="var(--muted)"
          >
            {{ formExtent.min }}
          </text>
          <path :d="tsbArea" fill="var(--tsb)" fill-opacity="0.12" />
          <path :d="tsbPath" fill="none" stroke="var(--tsb)" stroke-width="2" stroke-linejoin="round" />
          <text
            v-if="last"
            :x="width - PAD.right + 8"
            :y="yForm(last.tsb) + 4"
            class="text-[11px]"
            fill="var(--text)"
          >
            {{ last.tsb > 0 ? '+' : '' }}{{ Math.round(last.tsb) }}
          </text>
          <text
            v-for="i in xTicks"
            :key="i"
            :x="x(i)"
            :y="FORM_HEIGHT + 12"
            :text-anchor="i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'"
            class="text-[10px]"
            fill="var(--muted)"
          >
            {{ formatDate(points[i].date, { day: 'numeric', month: 'short' }) }}
          </text>
        </g>

        <g v-if="hovered && hover !== null" pointer-events="none">
          <line
            :x1="x(hover)"
            :x2="x(hover)"
            :y1="PAD.top"
            :y2="MAIN_HEIGHT + FORM_HEIGHT"
            stroke="var(--axis)"
          />
          <circle
            :cx="x(hover)"
            :cy="yMain(hovered.ctl)"
            r="4"
            fill="var(--ctl)"
            stroke="var(--surface)"
            stroke-width="2"
          />
          <circle
            :cx="x(hover)"
            :cy="yMain(hovered.atl)"
            r="4"
            fill="var(--atl)"
            stroke="var(--surface)"
            stroke-width="2"
          />
          <circle
            :cx="x(hover)"
            :cy="MAIN_HEIGHT + yForm(hovered.tsb)"
            r="4"
            fill="var(--tsb)"
            stroke="var(--surface)"
            stroke-width="2"
          />
        </g>
      </svg>

      <div
        v-if="hovered"
        class="pointer-events-none absolute top-8 w-40 rounded-md bg-white px-3 py-2 text-xs shadow-md ring-1 ring-slate-200"
        :style="{ left: `${tooltipLeft}px` }"
      >
        <p class="font-medium text-slate-900">{{ formatDate(hovered.date) }}</p>
        <dl class="mt-1 grid grid-cols-[1fr_auto] gap-x-2 text-slate-700">
          <dt>Fitness</dt>
          <dd class="text-right tabular-nums">{{ hovered.ctl.toFixed(1) }}</dd>
          <dt>Fatigue</dt>
          <dd class="text-right tabular-nums">{{ hovered.atl.toFixed(1) }}</dd>
          <dt>Form</dt>
          <dd class="text-right tabular-nums">{{ hovered.tsb.toFixed(1) }}</dd>
          <dt>Load that day</dt>
          <dd class="text-right tabular-nums">{{ Math.round(hovered.tss) }}</dd>
        </dl>
      </div>
    </template>

    <div v-else class="max-h-72 overflow-y-auto">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-white text-left text-xs text-slate-500">
          <tr>
            <th class="py-1 font-medium">Date</th>
            <th class="py-1 text-right font-medium">Load</th>
            <th class="py-1 text-right font-medium">Fitness</th>
            <th class="py-1 text-right font-medium">Fatigue</th>
            <th class="py-1 text-right font-medium">Form</th>
          </tr>
        </thead>
        <tbody class="tabular-nums">
          <tr v-for="p in [...points].reverse()" :key="p.date" class="border-t border-slate-100">
            <td class="py-1">{{ formatDate(p.date) }}</td>
            <td class="py-1 text-right">{{ Math.round(p.tss) }}</td>
            <td class="py-1 text-right">{{ p.ctl.toFixed(1) }}</td>
            <td class="py-1 text-right">{{ p.atl.toFixed(1) }}</td>
            <td class="py-1 text-right">{{ p.tsb.toFixed(1) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.load-chart {
  /* Categorical slots 1, 2 and 7 of the validated reference palette (light). */
  --ctl: #2a78d6;
  --atl: #eb6834;
  --tsb: #4a3aa7;
  --surface: #ffffff;
  --text: #334155;
  --muted: #64748b;
  --grid: #eef0f3;
  --axis: #cbd5e1;
}
</style>
