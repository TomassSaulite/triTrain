<script setup lang="ts">
import { reactive, ref } from 'vue'
import { athleteApi } from '@/api'
import type { CoachPreferences, Discipline, Weekday } from '@/api/types'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppField from '@/components/ui/AppField.vue'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'
import { WEEKDAYS } from '@/utils/dates'

/**
 * The coach's finer knobs. Empty means "let the coach decide".
 */
const auth = useAuthStore()
const prefs = auth.athlete!.preferences

const form = reactive({
  max_ramp_rate: prefs.max_ramp_rate,
  recovery_week_every: prefs.recovery_week_every === null ? '' : String(prefs.recovery_week_every),
  target_ctl: prefs.target_ctl === null ? '' : String(prefs.target_ctl),
  custom_split: prefs.sport_share !== null,
  share: { swim: 20, bike: 45, run: 35, ...percent(prefs.sport_share) } as Record<Discipline, number>,
  limits: Object.fromEntries(
    WEEKDAYS.map((d) => [d.value, prefs.day_limits_minutes[d.value]?.toString() ?? '']),
  ) as Record<Weekday, string>,
})

function percent(share: CoachPreferences['sport_share']): Partial<Record<Discipline, number>> {
  return share
    ? {
        swim: Math.round(share.swim * 100),
        bike: Math.round(share.bike * 100),
        run: Math.round(share.run * 100),
      }
    : {}
}

const saved = ref(false)
const { submitting, error, fieldErrors, submit } = useForm()

async function save(): Promise<void> {
  saved.value = false
  const total = form.share.swim + form.share.bike + form.share.run

  if (form.custom_split && total !== 100) {
    fieldErrors['preferences.sport_share'] = `The split adds up to ${total}%, not 100%.`
    return
  }

  const limits = Object.fromEntries(
    Object.entries(form.limits)
      .filter(([, v]) => v !== '')
      .map(([d, v]) => [d, Number(v)]),
  )
  const updated = await submit(() =>
    athleteApi.save({
      preferences: {
        max_ramp_rate: Number(form.max_ramp_rate),
        recovery_week_every: form.recovery_week_every === '' ? null : Number(form.recovery_week_every),
        target_ctl: form.target_ctl === '' ? null : Number(form.target_ctl),
        sport_share: form.custom_split
          ? { swim: form.share.swim / 100, bike: form.share.bike / 100, run: form.share.run / 100 }
          : null,
        day_limits_minutes: limits,
      },
    }),
  )

  if (updated) {
    auth.setAthlete(updated)
    saved.value = true
  }
}
</script>

<template>
  <AppCard id="coach" title="Coaching">
    <form class="space-y-5" @submit.prevent="save">
      <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>
      <div class="grid gap-4 sm:grid-cols-3">
        <AppField
          v-model.number="form.max_ramp_rate"
          label="Max fitness gain per week"
          type="number"
          min="1"
          max="8"
          step="0.5"
          hint="CTL points. 5 is a sensible default."
          :error="fieldErrors['preferences.max_ramp_rate']"
        />
        <AppField
          v-slot="{ id }"
          label="Recovery week"
          :error="fieldErrors['preferences.recovery_week_every']"
        >
          <select
            :id="id"
            v-model="form.recovery_week_every"
            class="block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
          >
            <option value="">Coach decides (3:1, or 2:1 from age 50)</option>
            <option value="2">Every 2nd week (1:1)</option>
            <option value="3">Every 3rd week (2:1)</option>
            <option value="4">Every 4th week (3:1)</option>
            <option value="5">Every 5th week (4:1)</option>
          </select>
        </AppField>
        <AppField
          v-model="form.target_ctl"
          label="Peak fitness target (CTL)"
          type="number"
          min="20"
          max="150"
          hint="Empty: set from your race and experience."
          :error="fieldErrors['preferences.target_ctl']"
        />
      </div>

      <fieldset>
        <legend class="text-sm font-medium text-slate-700">Most minutes you can train each day</legend>
        <p class="text-sm text-slate-500">Leave a day empty for no limit.</p>
        <div class="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
          <label v-for="day in WEEKDAYS" :key="day.value" class="text-xs text-slate-600">
            {{ day.short }}
            <input
              v-model="form.limits[day.value]"
              type="number"
              min="0"
              max="600"
              :aria-label="`${day.long} limit in minutes`"
              class="mt-0.5 block w-full rounded-md px-2 py-1.5 text-sm ring-1 ring-slate-300"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            v-model="form.custom_split"
            type="checkbox"
            class="size-4 rounded border-slate-300 text-indigo-600"
          />
          Set my own swim / bike / run split
        </label>
        <div v-if="form.custom_split" class="mt-2 grid grid-cols-3 gap-3">
          <AppField
            v-for="s in ['swim', 'bike', 'run'] as Discipline[]"
            :key="s"
            v-model.number="form.share[s]"
            :label="`${s} %`"
            type="number"
            min="5"
            max="80"
            class="capitalize"
          />
        </div>
        <p v-if="fieldErrors['preferences.sport_share']" class="mt-1 text-sm text-rose-600">
          {{ fieldErrors['preferences.sport_share'] }}
        </p>
      </fieldset>

      <div class="flex items-center justify-end gap-3">
        <p v-if="saved" class="text-sm text-emerald-700" role="status">
          Saved. Your plan is being updated to match.
        </p>
        <AppButton type="submit" :loading="submitting">Save</AppButton>
      </div>
    </form>
  </AppCard>
</template>
