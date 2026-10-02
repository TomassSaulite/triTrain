<script setup lang="ts">
import { computed } from 'vue'
import { racesApi } from '@/api'
import SportBadge from '@/components/SportBadge.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { formatDate } from '@/utils/dates'
import { distanceLabel } from '@/utils/races'
import { formatDistance, formatPacing, formatPercent, formatRaceTime } from '@/utils/format'
import { SPORTS } from '@/utils/sports'

const props = defineProps<{ id: string }>()

const page = useAsync(async () => {
  const [race, strategy] = await Promise.all([
    racesApi.get(Number(props.id)),
    racesApi.strategy(Number(props.id)),
  ])

  return { race, strategy }
})

/** Swim, transitions and the rest as shares of the finish time, for the splits bar. */
const segments = computed(() => {
  const strategy = page.data.value?.strategy
  if (!strategy?.finish_s) return []

  const legs = strategy.legs.map((leg) => ({
    key: leg.sport,
    label: SPORTS[leg.sport].label,
    seconds: leg.predicted_s ?? 0,
    color: `var(--color-${leg.sport})`,
  }))
  const transitions = {
    key: 'transitions',
    label: 'Transitions',
    seconds: strategy.transitions_s,
    color: 'var(--chart-axis)',
  }
  // Both transitions sit together after the swim: close enough at this scale.
  const ordered = strategy.transitions_s ? [legs[0], transitions, ...legs.slice(1)] : legs

  return ordered.map((s) => ({ ...s, share: s.seconds / strategy.finish_s! }))
})

const isTriathlon = computed(() => (page.data.value?.strategy.legs.length ?? 0) > 1)
</script>

<template>
  <LoadingState :loading="page.loading.value" :error="page.error.value" @retry="page.run">
    <div v-if="page.data.value" class="mx-auto max-w-4xl space-y-6">
      <RouterLink :to="{ name: 'races' }" class="text-sm text-slate-500 hover:text-slate-800"
        >← Races</RouterLink
      >

      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm text-slate-500">Race plan</p>
          <h1 class="text-2xl font-semibold">{{ page.data.value.race.name }}</h1>
          <p class="text-slate-600">
            {{ distanceLabel(page.data.value.race.distance) }} ·
            {{ formatDate(page.data.value.race.date, { weekday: 'long', day: 'numeric', month: 'long' }) }} ·
            {{ page.data.value.race.days_to_go }} days to go
          </p>
        </div>
        <div v-if="page.data.value.strategy.finish_s" class="sm:text-right">
          <p class="text-xs text-slate-500">Predicted finish</p>
          <p class="text-3xl font-semibold tabular-nums">
            {{ formatRaceTime(page.data.value.strategy.finish_s) }}
          </p>
          <p class="text-xs text-slate-500">at today's fitness, on a flat course</p>
        </div>
      </header>

      <AppAlert v-if="page.data.value.strategy.missing.length" tone="info">
        <p v-for="item in page.data.value.strategy.missing" :key="item">{{ item }}</p>
        <RouterLink :to="{ name: 'settings' }" class="mt-1 inline-block font-medium underline">
          Go to Settings
        </RouterLink>
      </AppAlert>

      <section v-if="segments.length && isTriathlon" aria-label="Predicted splits">
        <div class="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
          <div
            v-for="s in segments"
            :key="s.key"
            class="h-full border-r-2 border-white last:border-r-0"
            :style="{ width: formatPercent(s.share), backgroundColor: s.color }"
          />
        </div>
        <ul class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <li v-for="s in segments" :key="s.key" class="flex items-center gap-1.5">
            <span class="size-2.5 rounded-full" :style="{ backgroundColor: s.color }" aria-hidden="true" />
            <span class="text-slate-600">{{ s.label }}</span>
            <span class="font-medium tabular-nums">{{ formatRaceTime(s.seconds) }}</span>
          </li>
        </ul>
      </section>

      <ol class="grid gap-4 md:grid-cols-3" :class="{ 'md:grid-cols-1': !isTriathlon }">
        <li
          v-for="leg in page.data.value.strategy.legs"
          :key="leg.sport"
          class="min-w-0 rounded-lg border-t-4 bg-surface p-4 shadow-xs ring-1 ring-slate-200"
          :style="{ borderTopColor: `var(--color-${leg.sport})` }"
        >
          <div class="flex items-center justify-between gap-2">
            <SportBadge :sport="leg.sport" />
            <span class="text-sm text-slate-500">{{ formatDistance(leg.distance_m) }}</span>
          </div>
          <template v-if="leg.target">
            <p class="mt-3 text-xs text-slate-500">Aim for</p>
            <p class="text-2xl font-semibold tabular-nums">
              {{ formatPacing(leg.target.unit, leg.target.target) }}
            </p>
            <p class="text-sm text-slate-600 tabular-nums">
              Range {{ formatPacing(leg.target.unit, leg.target.easy) }} to
              {{ formatPacing(leg.target.unit, leg.target.hard) }} ·
              {{ formatPercent(leg.target.intensity) }} of threshold
            </p>
            <p v-if="leg.predicted_s" class="mt-2 text-sm">
              Split <span class="font-medium tabular-nums">{{ formatRaceTime(leg.predicted_s) }}</span>
            </p>
          </template>
          <p v-else class="mt-3 text-sm text-slate-500">No threshold yet, so no target.</p>
          <p class="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-700">{{ leg.advice }}</p>
        </li>
      </ol>

      <div class="grid gap-4 md:grid-cols-2">
        <AppCard title="Fueling before">
          <ul class="space-y-2 text-sm text-slate-700">
            <li v-for="item in page.data.value.strategy.fueling.before" :key="item" class="flex gap-2">
              <span class="text-indigo-400" aria-hidden="true">•</span><span>{{ item }}</span>
            </li>
          </ul>
        </AppCard>
        <AppCard title="Fueling during">
          <ul class="space-y-2 text-sm text-slate-700">
            <li v-for="item in page.data.value.strategy.fueling.during" :key="item" class="flex gap-2">
              <span class="text-indigo-400" aria-hidden="true">•</span><span>{{ item }}</span>
            </li>
          </ul>
        </AppCard>
      </div>

      <p class="text-xs text-slate-500">
        Targets come from your current thresholds and update as they improve. Practise this pacing and fueling
        in your long sessions before race day.
      </p>
    </div>
  </LoadingState>
</template>
