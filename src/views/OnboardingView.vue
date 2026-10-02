<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { athleteApi, racesApi, thresholdsApi } from '@/api'
import type { RaceInput, ThresholdMetric } from '@/api/types'
import ProfileForm from '@/components/forms/ProfileForm.vue'
import RaceForm from '@/components/forms/RaceForm.vue'
import ScheduleForm from '@/components/forms/ScheduleForm.vue'
import ThresholdsForm from '@/components/forms/ThresholdsForm.vue'
import { defaultProfile, defaultSchedule, toAthleteInput } from '@/components/forms/profile'
import { emptyThresholds, parseThresholds } from '@/components/forms/thresholds'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'
import { addDays, nextSunday, today } from '@/utils/dates'

const auth = useAuthStore()
const router = useRouter()
const { submitting, error, fieldErrors, submit } = useForm()

const steps = [
  { title: 'About you', intro: 'The coach sizes your plan from your experience and the time you have.' },
  {
    title: 'Your week',
    intro: 'Tell the coach which days suit which sessions. You can change this any time.',
  },
  {
    title: 'Your thresholds',
    intro:
      'Workouts are written as a share of these, so every session is set at your level. Skip any you do not know yet.',
  },
  { title: 'Your goal race', intro: 'The plan works backwards from race day. You can also add this later.' },
] as const

const step = ref(0)
const profile = ref(defaultProfile())
const schedule = ref(defaultSchedule())
const thresholds = ref(emptyThresholds())
const thresholdErrors = ref<Record<string, string>>({})
const race = reactive<RaceInput>({
  name: '',
  distance: 'half',
  date: nextSunday(addDays(today(), 7 * 20)),
  priority: 'A',
})

const isLast = computed(() => step.value === steps.length - 1)

function next(): void {
  if (step.value === 2) {
    thresholdErrors.value = parseThresholds(thresholds.value).errors

    if (Object.keys(thresholdErrors.value).length > 0) {
      return
    }
  }

  step.value++
}

/** Saves everything in order; an optional race creates the first plan. */
async function finish(withRace: boolean): Promise<void> {
  const created = await submit(async () => {
    if (!auth.athlete) {
      auth.setAthlete(await athleteApi.save(toAthleteInput(profile.value, schedule.value)))

      const { values } = parseThresholds(thresholds.value)

      for (const [metric, value] of Object.entries(values)) {
        await thresholdsApi.record(metric as ThresholdMetric, value)
      }
    }

    if (withRace) {
      const goal = await racesApi.create(race)
      await racesApi.createPlan(goal.id)
    }

    return true
  })

  if (created) {
    await router.push({ name: withRace ? 'plan' : 'dashboard' })
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-10">
    <p class="text-2xl font-bold tracking-tight text-indigo-700">TriTrain</p>
    <ol class="mt-6 flex gap-2" aria-label="Progress">
      <li
        v-for="(s, i) in steps"
        :key="s.title"
        class="h-1.5 flex-1 rounded-full"
        :class="i <= step ? 'bg-indigo-600' : 'bg-slate-200'"
        :aria-current="i === step ? 'step' : undefined"
      />
    </ol>

    <section class="mt-6 rounded-lg bg-surface p-6 shadow-sm ring-1 ring-slate-200">
      <h1 class="text-xl font-semibold">{{ steps[step].title }}</h1>
      <p class="mt-1 mb-5 text-sm text-slate-600">{{ steps[step].intro }}</p>

      <AppAlert v-if="error" tone="error" class="mb-4">{{ error }}</AppAlert>

      <ProfileForm v-if="step === 0" v-model="profile" :errors="fieldErrors" />
      <ScheduleForm v-else-if="step === 1" v-model="schedule" :errors="fieldErrors" />
      <ThresholdsForm v-else-if="step === 2" v-model="thresholds" :errors="thresholdErrors" />
      <RaceForm v-else v-model="race" :errors="fieldErrors" triathlon-only />

      <div class="mt-6 flex items-center justify-between gap-3">
        <AppButton v-if="step > 0" variant="ghost" @click="step--">Back</AppButton>
        <span v-else />
        <div class="flex gap-2">
          <template v-if="isLast">
            <AppButton variant="secondary" :loading="submitting" @click="finish(false)"
              >Skip for now</AppButton
            >
            <AppButton :loading="submitting" :disabled="!race.name" @click="finish(true)"
              >Build my plan</AppButton
            >
          </template>
          <AppButton v-else @click="next">Continue</AppButton>
        </div>
      </div>
    </section>
  </main>
</template>
