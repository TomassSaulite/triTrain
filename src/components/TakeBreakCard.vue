<script setup lang="ts">
import { computed, ref } from 'vue'
import { availabilityApi } from '@/api'
import type { BreakReason } from '@/api/types'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useForm } from '@/composables/useForm'
import { useToast } from '@/composables/useToast'
import { addDays, daysBetween, formatDate, today } from '@/utils/dates'

/**
 * "Can't train?": tell the coach you are sick, injured or away and the plan
 * is rebuilt around the break, instead of moving sessions one by one.
 */
const emit = defineEmits<{ done: [] }>()

const REASONS: { value: BreakReason; label: string; hint: string }[] = [
  {
    value: 'sick',
    label: 'Sick',
    hint: 'Rest until the symptoms are gone. The first days back are kept short.',
  },
  {
    value: 'injured',
    label: 'Injured',
    hint: 'Get it checked if it lasts. The first days back are kept short.',
  },
  { value: 'away', label: 'Away', hint: 'Travel, work or family: the plan works around the days.' },
  { value: 'other', label: 'Other', hint: 'Any days you cannot train.' },
]
const LENGTHS = [
  { days: 1, label: 'Today' },
  { days: 3, label: '3 days' },
  { days: 7, label: 'A week' },
]

const open = ref(false)
const reason = ref<BreakReason>('sick')
const from = ref(today())
const to = ref(today())
const note = ref('')
const { submitting, error, submit } = useForm()
const toast = useToast()

const days = computed(() => daysBetween(from.value, to.value) + 1)
const hint = computed(() => REASONS.find((r) => r.value === reason.value)!.hint)

function setLength(length: number): void {
  from.value = today()
  to.value = addDays(today(), length - 1)
}

async function save(): Promise<void> {
  const saved = await submit(() =>
    availabilityApi.takeBreak({
      from: from.value,
      to: to.value,
      reason: reason.value,
      note: note.value || null,
    }),
  )
  if (!saved) return

  open.value = false
  note.value = ''
  toast.success(
    days.value === 1
      ? `Noted for ${formatDate(from.value)}. Your plan is being rebuilt around it.`
      : `Noted: ${days.value} days off. Your plan is being rebuilt around them.`,
  )
  emit('done')
}
</script>

<template>
  <div>
    <button
      v-if="!open"
      type="button"
      class="text-sm font-medium text-indigo-700 hover:underline"
      @click="open = true"
    >
      Can't train? Sick, injured or away
    </button>

    <form
      v-else
      class="space-y-4 rounded-lg bg-surface p-4 shadow-xs ring-1 ring-slate-200 sm:p-5"
      aria-labelledby="break-title"
      @submit.prevent="save"
    >
      <div class="flex items-start justify-between gap-3">
        <h2 id="break-title" class="text-base font-semibold">Can't train?</h2>
        <button type="button" class="text-sm text-slate-500 hover:text-slate-800" @click="open = false">
          Cancel
        </button>
      </div>

      <fieldset>
        <legend class="sr-only">Why</legend>
        <div class="flex flex-wrap gap-2">
          <label v-for="r in REASONS" :key="r.value" class="cursor-pointer">
            <input v-model="reason" type="radio" name="break-reason" :value="r.value" class="peer sr-only" />
            <span
              class="block rounded-full px-3.5 py-1.5 text-sm ring-1 ring-slate-300 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:ring-indigo-600 peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-600"
              >{{ r.label }}</span
            >
          </label>
        </div>
        <p class="mt-2 text-sm text-slate-600">{{ hint }}</p>
      </fieldset>

      <div class="flex flex-wrap items-end gap-3">
        <div class="flex gap-1.5">
          <button
            v-for="l in LENGTHS"
            :key="l.days"
            type="button"
            class="rounded-md px-2.5 py-1.5 text-sm ring-1"
            :class="
              from === today() && days === l.days
                ? 'bg-indigo-50 text-indigo-800 ring-indigo-400'
                : 'text-slate-700 ring-slate-300 hover:bg-slate-50'
            "
            @click="setLength(l.days)"
          >
            {{ l.label }}
          </button>
        </div>
        <label class="text-sm">
          <span class="block text-slate-600">From</span>
          <input
            v-model="from"
            type="date"
            :min="today()"
            required
            class="mt-1 rounded-md px-3 py-1.5 text-sm ring-1 ring-slate-300"
            @change="to < from && (to = from)"
          />
        </label>
        <label class="text-sm">
          <span class="block text-slate-600">To</span>
          <input
            v-model="to"
            type="date"
            :min="from"
            :max="addDays(from, 27)"
            required
            class="mt-1 rounded-md px-3 py-1.5 text-sm ring-1 ring-slate-300"
          />
        </label>
      </div>

      <label class="block text-sm">
        <span class="text-slate-600">Note (optional)</span>
        <input
          v-model="note"
          type="text"
          maxlength="200"
          placeholder="e.g. flu, work trip to Berlin"
          class="mt-1 w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
        />
      </label>

      <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>

      <AppButton type="submit" :loading="submitting">
        {{ days === 1 ? 'Take the day off' : `Take ${days} days off` }}
      </AppButton>
    </form>
  </div>
</template>
