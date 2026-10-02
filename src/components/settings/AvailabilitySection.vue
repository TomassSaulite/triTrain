<script setup lang="ts">
import { reactive } from 'vue'
import { availabilityApi } from '@/api'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppField from '@/components/ui/AppField.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { addDays, formatDate, today } from '@/utils/dates'

const list = useAsync(() => availabilityApi.list())
const { submitting, error, fieldErrors, submit } = useForm()
const draft = reactive({ date: addDays(today(), 1), minutes: 0, note: '' })

async function add(): Promise<void> {
  const done = await submit(() =>
    availabilityApi.set(draft.date, Number(draft.minutes), draft.note || undefined),
  )

  if (done) {
    Object.assign(draft, { date: addDays(draft.date, 1), minutes: 0, note: '' })
    await list.run()
  }
}

async function clear(date: string): Promise<void> {
  await submit(() => availabilityApi.clear(date))
  if (!error.value) await list.run()
}
</script>

<template>
  <AppCard id="availability" title="Travel and busy days">
    <p class="mb-4 text-sm text-slate-600">
      Mark days you can't train, or only briefly. Your plan is adjusted around them.
    </p>
    <form class="grid items-end gap-3 sm:grid-cols-[auto_auto_1fr_auto]" @submit.prevent="add">
      <AppField
        v-model="draft.date"
        label="Date"
        type="date"
        :min="today()"
        required
        :error="fieldErrors.date"
      />
      <AppField
        v-model.number="draft.minutes"
        label="Minutes available"
        type="number"
        min="0"
        max="600"
        :error="fieldErrors.available_minutes"
      />
      <AppField v-model="draft.note" label="Note" placeholder="Work trip" :error="fieldErrors.note" />
      <AppButton type="submit" :loading="submitting">Add</AppButton>
    </form>
    <AppAlert v-if="error" tone="error" class="mt-3">{{ error }}</AppAlert>

    <LoadingState :loading="list.loading.value" :error="list.error.value" @retry="list.run">
      <ul v-if="list.data.value?.length" class="mt-4 divide-y divide-slate-100 text-sm">
        <li v-for="o in list.data.value" :key="o.date" class="flex items-center justify-between py-2">
          <span>
            <span class="font-medium">{{ formatDate(o.date) }}</span> ·
            {{ o.available_minutes === 0 ? 'No training' : `${o.available_minutes} min` }}
            <span v-if="o.note" class="text-slate-500">· {{ o.note }}</span>
          </span>
          <button class="text-slate-500 hover:text-rose-700" @click="clear(o.date)">Remove</button>
        </li>
      </ul>
    </LoadingState>
  </AppCard>
</template>
