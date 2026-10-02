<script setup lang="ts">
import { computed, ref } from 'vue'
import { calendarFeedApi } from '@/api'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { errorMessage, useAsync } from '@/composables/useAsync'
import { useDialog } from '@/composables/useDialog'
import { useToast } from '@/composables/useToast'

const { confirm } = useDialog()
const toast = useToast()
const feed = useAsync(() => calendarFeedApi.get())
const busy = ref(false)
const error = ref<string | null>(null)

const url = computed(() => feed.data.value?.url ?? null)
/** Apple Calendar opens its subscribe dialog for webcal:// links. */
const webcal = computed(() => url.value?.replace(/^https?:\/\//, 'webcal://') ?? null)

async function run(action: () => Promise<unknown>): Promise<void> {
  busy.value = true
  error.value = null
  try {
    await action()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}

const enable = () =>
  run(async () => {
    feed.data.value = await calendarFeedApi.enable()
  })

async function rotate(): Promise<void> {
  if (
    !(await confirm({
      title: 'Make a new link?',
      message: 'The current link stops working. Calendars subscribed to it need the new one.',
      confirmLabel: 'New link',
    }))
  )
    return
  await enable()
  if (!error.value) toast.success('New link ready. Subscribe your calendar to it again.')
}

async function disable(): Promise<void> {
  if (
    !(await confirm({
      title: 'Turn off the calendar feed?',
      message: 'Subscribed calendars stop updating, and the link stops working.',
      confirmLabel: 'Turn off',
      danger: true,
    }))
  )
    return
  await run(async () => {
    await calendarFeedApi.disable()
    feed.data.value = { url: null }
  })
}

async function copy(): Promise<void> {
  if (!url.value) return
  try {
    await navigator.clipboard.writeText(url.value)
    toast.success('Link copied.')
  } catch {
    toast.error('Could not copy. Select the link and copy it yourself.')
  }
}
</script>

<template>
  <AppCard id="calendar" title="Your calendar">
    <AppAlert v-if="error" tone="error" class="mb-3">{{ error }}</AppAlert>
    <LoadingState :loading="feed.loading.value" :error="feed.error.value" @retry="feed.run">
      <div v-if="url" class="space-y-3">
        <p class="text-sm text-slate-600">
          Subscribe to this private link in Google, Apple or Outlook calendar. Every session and race shows up
          there and follows your plan as it changes. Anyone with the link can see your plan, so keep it to
          yourself.
        </p>
        <div class="flex gap-2">
          <input
            :value="url"
            readonly
            aria-label="Calendar link"
            class="min-w-0 flex-1 rounded-md bg-slate-50 px-3 py-2 font-mono text-xs ring-1 ring-slate-300"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <AppButton variant="secondary" @click="copy">Copy</AppButton>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <a
            :href="webcal!"
            class="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-500"
            >Open in Apple Calendar</a
          >
          <a
            :href="`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal!)}`"
            target="_blank"
            rel="noopener"
            class="rounded-md px-3.5 py-2 text-sm font-medium text-slate-800 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
            >Add to Google Calendar</a
          >
          <span class="ml-auto flex gap-1">
            <AppButton variant="ghost" size="sm" :disabled="busy" @click="rotate">New link</AppButton>
            <AppButton variant="ghost" size="sm" :disabled="busy" @click="disable">Turn off</AppButton>
          </span>
        </div>
        <p class="text-xs text-slate-500">Calendar apps refresh subscribed calendars every few hours.</p>
      </div>
      <div v-else class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-600">See your sessions and races in the calendar you already use.</p>
        <AppButton :loading="busy" @click="enable">Get calendar link</AppButton>
      </div>
    </LoadingState>
  </AppCard>
</template>
