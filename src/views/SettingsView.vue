<script setup lang="ts">
import AvailabilitySection from '@/components/settings/AvailabilitySection.vue'
import CalendarSection from '@/components/settings/CalendarSection.vue'
import CoachSection from '@/components/settings/CoachSection.vue'
import ProfileSection from '@/components/settings/ProfileSection.vue'
import StravaSection from '@/components/settings/StravaSection.vue'
import ThresholdsSection from '@/components/settings/ThresholdsSection.vue'

const sections = [
  { id: 'profile', label: 'Profile and week' },
  { id: 'coach', label: 'Coaching' },
  { id: 'thresholds', label: 'Thresholds' },
  { id: 'availability', label: 'Travel and busy days' },
  { id: 'strava', label: 'Strava' },
  { id: 'calendar', label: 'Your calendar' },
]
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[12rem_1fr]">
    <nav class="lg:sticky lg:top-6 lg:self-start" aria-label="Settings sections">
      <h1 class="mb-3 text-2xl font-semibold">Settings</h1>
      <ul class="flex flex-wrap gap-2 text-sm lg:flex-col lg:gap-1">
        <li v-for="s in sections" :key="s.id">
          <a
            :href="`#${s.id}`"
            class="block rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >{{ s.label }}</a
          >
        </li>
      </ul>
    </nav>
    <div class="space-y-6">
      <ProfileSection />
      <CoachSection />
      <ThresholdsSection />
      <AvailabilitySection />
      <StravaSection />
      <CalendarSection />
    </div>
  </div>
</template>
