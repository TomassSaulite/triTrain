<script setup lang="ts">
import AppField from '@/components/ui/AppField.vue'
import type { ProfileDraft } from './profile'

defineProps<{ errors?: Record<string, string | undefined> }>()
const profile = defineModel<ProfileDraft>({ required: true })

const timezones = Intl.supportedValuesOf('timeZone')

const experiences = [
  { value: 'novice', label: 'Novice', hint: 'First season or first race at this distance' },
  { value: 'intermediate', label: 'Intermediate', hint: 'A few seasons of structured training' },
  { value: 'advanced', label: 'Advanced', hint: 'Years of racing, high training volume' },
] as const
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <fieldset class="sm:col-span-2">
      <legend class="text-sm font-medium text-slate-700">Experience</legend>
      <div class="mt-1 grid gap-2 sm:grid-cols-3">
        <label
          v-for="option in experiences"
          :key="option.value"
          class="cursor-pointer rounded-md p-3 ring-1 transition"
          :class="
            profile.experience === option.value
              ? 'bg-indigo-50 ring-indigo-600'
              : 'ring-slate-300 hover:bg-slate-50'
          "
        >
          <input v-model="profile.experience" type="radio" :value="option.value" class="sr-only" />
          <span class="block text-sm font-medium">{{ option.label }}</span>
          <span class="block text-xs text-slate-500">{{ option.hint }}</span>
        </label>
      </div>
    </fieldset>

    <AppField
      v-model.number="profile.weekly_hours"
      label="Hours you can train per week"
      type="number"
      min="2"
      max="30"
      step="0.5"
      required
      :error="errors?.weekly_hours"
    />

    <AppField
      v-slot="{ id }"
      label="Weakest discipline"
      :error="errors?.weakest_sport"
      hint="It gets a little more time."
    >
      <select
        :id="id"
        v-model="profile.weakest_sport"
        class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
      >
        <option :value="null">No particular weakness</option>
        <option value="swim">Swim</option>
        <option value="bike">Bike</option>
        <option value="run">Run</option>
      </select>
    </AppField>

    <AppField
      v-model.number="profile.birth_year"
      label="Birth year"
      type="number"
      min="1920"
      :error="errors?.birth_year"
    />

    <AppField
      v-slot="{ id }"
      label="Timezone"
      :error="errors?.timezone"
      hint="Decides which day your activities count on."
    >
      <select
        :id="id"
        v-model="profile.timezone"
        class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
      >
        <option v-for="zone in timezones" :key="zone" :value="zone">{{ zone }}</option>
      </select>
    </AppField>

    <AppField
      v-model.number="profile.weight_kg"
      label="Weight (kg)"
      type="number"
      step="0.1"
      :error="errors?.weight_kg"
    />
    <AppField v-model.number="profile.max_hr" label="Max heart rate" type="number" :error="errors?.max_hr" />
  </div>
</template>
