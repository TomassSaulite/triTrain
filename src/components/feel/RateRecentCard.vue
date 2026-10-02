<script setup lang="ts">
import { ref } from 'vue'
import type { Activity, SessionFeedback } from '@/api/types'
import SportBadge from '@/components/SportBadge.vue'
import { formatDateTime } from '@/utils/dates'
import { formatDuration, titleCase } from '@/utils/format'
import FeelForm from './FeelForm.vue'

/** Recent sessions the athlete has not rated yet, each with the rating form a tap away. */
defineProps<{ activities: Activity[] }>()
const emit = defineEmits<{ rated: [activity: Activity, feedback: SessionFeedback] }>()

const open = ref<number | null>(null)

function saved(activity: Activity, feedback: SessionFeedback): void {
  open.value = null
  emit('rated', activity, feedback)
}
</script>

<template>
  <section
    v-if="activities.length"
    class="min-w-0 rounded-lg bg-white p-4 shadow-xs ring-1 ring-slate-200 sm:p-5"
    aria-labelledby="rate-recent-title"
  >
    <h2 id="rate-recent-title" class="text-base font-semibold text-slate-900">How did it feel?</h2>
    <p class="mt-1 text-sm text-slate-600">
      Rate your recent sessions. How you feel tells the coach things the numbers can't.
    </p>
    <ul class="mt-3 divide-y divide-slate-100">
      <li v-for="a in activities" :key="a.id" class="py-2.5">
        <button
          type="button"
          class="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left"
          :aria-expanded="open === a.id"
          @click="open = open === a.id ? null : a.id"
        >
          <SportBadge :sport="a.sport" />
          <span class="min-w-0 flex-1 text-sm font-medium">{{ a.name ?? titleCase(a.sport) }}</span>
          <span class="text-xs text-slate-500"
            >{{ formatDateTime(a.started_at) }} · {{ formatDuration(a.duration_s) }}</span
          >
          <span class="text-sm font-medium text-indigo-700">{{ open === a.id ? 'Close' : 'Rate' }}</span>
        </button>
        <div v-if="open === a.id" class="mt-3 rounded-lg bg-slate-50 p-4">
          <FeelForm :activity-id="a.id" @saved="(f) => saved(a, f)" />
        </div>
      </li>
    </ul>
  </section>
</template>
