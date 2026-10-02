<script setup lang="ts">
import AppField from '@/components/ui/AppField.vue'
import type { ThresholdDraft } from './thresholds'

defineProps<{ errors?: Record<string, string | undefined> }>()
const draft = defineModel<ThresholdDraft>({ required: true })
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <AppField
      v-model="draft.ftp_w"
      label="FTP (watts)"
      placeholder="250"
      hint="From a 20-minute or ramp test."
      :error="errors?.ftp_w"
    />
    <AppField
      v-model="draft.threshold_pace_s_per_km"
      label="Threshold run pace (min:sec per km)"
      placeholder="4:30"
      hint="Roughly your 1-hour race pace."
      :error="errors?.threshold_pace_s_per_km"
    />
    <AppField
      v-model="draft.css_s_per_100m"
      label="Critical swim speed (min:sec per 100 m)"
      placeholder="1:45"
      hint="From a 400 m / 200 m test."
      :error="errors?.css_s_per_100m"
    />
    <AppField
      v-model="draft.lthr"
      label="Threshold heart rate (bpm)"
      placeholder="168"
      :error="errors?.lthr"
    />
  </div>
</template>
