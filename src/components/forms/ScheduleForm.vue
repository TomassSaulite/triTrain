<script setup lang="ts">
import { computed } from 'vue'
import WeekdayPicker from './WeekdayPicker.vue'
import type { ScheduleDraft } from './profile'

defineProps<{ errors?: Record<string, string | undefined> }>()
const schedule = defineModel<ScheduleDraft>({ required: true })

// The long sessions can't land on a rest day, and rest days can't take the long sessions.
const longDays = computed(() =>
  [schedule.value.long_ride_day, schedule.value.long_run_day].filter((d) => d !== null),
)
</script>

<template>
  <div class="space-y-5">
    <WeekdayPicker
      v-model="schedule.long_ride_day"
      label="Long ride day"
      :disabled-days="schedule.rest_days"
    />
    <WeekdayPicker
      v-model="schedule.long_run_day"
      label="Long run day"
      allow-none
      none-label="Let the coach pick"
      :disabled-days="schedule.rest_days"
    />
    <WeekdayPicker v-model="schedule.pool_days" label="Days you can get to a pool" multiple />
    <WeekdayPicker v-model="schedule.rest_days" label="Rest days" multiple :disabled-days="longDays" />
    <p v-if="errors?.['preferences.rest_days']" class="text-sm text-rose-600">
      {{ errors['preferences.rest_days'] }}
    </p>
    <label class="flex items-center gap-2 text-sm text-slate-700">
      <input
        v-model="schedule.bricks"
        type="checkbox"
        class="size-4 rounded border-slate-300 text-indigo-600"
      />
      Turn the long ride into a bike-run brick every other week from the build phase
    </label>
  </div>
</template>
