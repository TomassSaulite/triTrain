<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { stravaApi } from '@/api'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { errorMessage } from '@/composables/useAsync'
import { formatDateTime } from '@/utils/dates'

const route = useRoute()
const status = useAsync(() => stravaApi.status())
const busy = ref(false)
const error = ref<string | null>(null)

/** Outcomes the API reports when Strava sends the athlete back here. */
const RESULTS: Record<string, { tone: 'success' | 'error'; text: string }> = {
  connected: { tone: 'success', text: 'Strava connected. Your recent activities are being imported.' },
  denied: { tone: 'error', text: 'Strava access was not granted.' },
  invalid_state: { tone: 'error', text: 'That link expired. Please connect again.' },
  missing_scope: {
    tone: 'error',
    text: 'TriTrain needs permission to read your activities. Please connect again and allow it.',
  },
  exchange_failed: { tone: 'error', text: 'Strava did not accept the authorization. Please try again.' },
}
const result = typeof route.query.strava === 'string' ? RESULTS[route.query.strava] : undefined

async function connect(): Promise<void> {
  busy.value = true
  error.value = null

  try {
    window.location.assign(await stravaApi.connectUrl())
  } catch (e) {
    error.value = errorMessage(e)
    busy.value = false
  }
}

async function disconnect(): Promise<void> {
  if (!window.confirm('Disconnect Strava? Imported activities stay.')) return
  busy.value = true

  try {
    await stravaApi.disconnect()
    await status.run()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppCard id="strava" title="Strava">
    <AppAlert v-if="result" :tone="result.tone" class="mb-3">{{ result.text }}</AppAlert>
    <AppAlert v-if="error" tone="error" class="mb-3">{{ error }}</AppAlert>
    <LoadingState :loading="status.loading.value" :error="status.error.value" @retry="status.run">
      <div v-if="status.data.value?.connected" class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm">
          Connected
          <span v-if="status.data.value.connected_at"
            >since {{ formatDateTime(status.data.value.connected_at) }}</span
          >. New activities sync automatically.
        </p>
        <AppButton variant="secondary" :loading="busy" @click="disconnect">Disconnect</AppButton>
      </div>
      <div v-else class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-600">Sync your rides, runs and swims, and import the last six weeks.</p>
        <AppButton :loading="busy" class="bg-[#fc4c02]! hover:bg-[#e34402]!" @click="connect"
          >Connect with Strava</AppButton
        >
      </div>
    </LoadingState>
  </AppCard>
</template>
