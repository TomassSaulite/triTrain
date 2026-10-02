<script setup lang="ts">
import { ref } from 'vue'
import { athleteApi } from '@/api'
import ProfileForm from '@/components/forms/ProfileForm.vue'
import ScheduleForm from '@/components/forms/ScheduleForm.vue'
import { scheduleFrom, toAthleteInput, type ProfileDraft } from '@/components/forms/profile'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const athlete = auth.athlete!

const profile = ref<ProfileDraft>({
  timezone: athlete.timezone,
  experience: athlete.experience,
  weekly_hours: athlete.weekly_hours,
  birth_year: athlete.birth_year,
  weight_kg: athlete.weight_kg,
  max_hr: athlete.max_hr,
  weakest_sport: athlete.weakest_sport,
})
const schedule = ref(scheduleFrom(athlete.preferences))
const saved = ref(false)
const { submitting, error, fieldErrors, submit } = useForm()

async function save(): Promise<void> {
  saved.value = false
  const updated = await submit(() => athleteApi.save(toAthleteInput(profile.value, schedule.value)))

  if (updated) {
    auth.setAthlete(updated)
    saved.value = true
  }
}
</script>

<template>
  <AppCard id="profile" title="Profile and week">
    <form class="space-y-6" @submit.prevent="save">
      <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>
      <ProfileForm v-model="profile" :errors="fieldErrors" />
      <hr class="border-slate-100" />
      <ScheduleForm v-model="schedule" :errors="fieldErrors" />
      <div class="flex items-center justify-end gap-3">
        <p v-if="saved" class="text-sm text-emerald-700" role="status">
          Saved. Your plan is being updated to match.
        </p>
        <AppButton type="submit" :loading="submitting">Save</AppButton>
      </div>
    </form>
  </AppCard>
</template>
