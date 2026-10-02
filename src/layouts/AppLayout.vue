<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOnline } from '@/composables/useOnline'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const online = useOnline()

const ACTIVE = 'border-indigo-600! text-indigo-700!'

const primary = [
  { name: 'dashboard', label: 'Today', icon: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10' },
  { name: 'calendar', label: 'Calendar', icon: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  { name: 'plan', label: 'Plan', icon: 'M4 19h4V9H4zM10 19h4V5h-4zM16 19h4v-7h-4z' },
  { name: 'races', label: 'Races', icon: 'M5 21V4M5 4h11l-2 4 2 4H5' },
]

const secondary = [
  { name: 'activities', label: 'Activities' },
  { name: 'library', label: 'Workouts' },
  { name: 'settings', label: 'Settings' },
]

/** Workout and template pages belong to the section they were opened from. */
const section = computed(() => {
  const name = String(route.name ?? '')
  if (name === 'workout') return 'calendar'
  if (name === 'race-strategy') return 'races'
  if (name.startsWith('template')) return 'library'

  return name
})

const moreOpen = ref(false)
const moreActive = computed(() => secondary.some((link) => link.name === section.value))
watch(
  () => route.fullPath,
  () => (moreOpen.value = false),
)

async function logout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen pb-20 md:pb-0">
    <header class="border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)]">
      <div class="mx-auto flex max-w-6xl items-center gap-6 px-4">
        <RouterLink :to="{ name: 'dashboard' }" class="py-3 text-lg font-bold tracking-tight text-indigo-700">
          TriTrain
        </RouterLink>
        <nav class="-mb-px hidden flex-1 gap-1 md:flex" aria-label="Main">
          <RouterLink
            v-for="link in [...primary, ...secondary]"
            :key="link.name"
            :to="{ name: link.name }"
            class="border-b-2 border-transparent px-3 py-3.5 text-sm font-medium whitespace-nowrap text-slate-600 hover:text-slate-900"
            :class="{ [ACTIVE]: section === link.name }"
            :aria-current="section === link.name ? 'page' : undefined"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
        <button class="ml-auto hidden text-sm text-slate-500 hover:text-slate-800 md:block" @click="logout">
          Sign out
        </button>
      </div>
    </header>

    <p v-if="!online" role="status" class="bg-slate-800 px-4 py-2 text-center text-sm text-white">
      You're offline. Your plan will update when you're back online.
    </p>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <RouterView />
    </main>

    <!-- Phone navigation: the four daily sections as tabs, the rest under "More". -->
    <nav
      class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Main"
    >
      <div
        v-if="moreOpen"
        id="more-menu"
        class="absolute right-2 bottom-full mb-2 w-48 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-slate-200"
      >
        <RouterLink
          v-for="link in secondary"
          :key="link.name"
          :to="{ name: link.name }"
          class="block px-4 py-3 text-sm hover:bg-slate-50"
          :class="section === link.name ? 'font-semibold text-indigo-700' : 'text-slate-700'"
        >
          {{ link.label }}
        </RouterLink>
        <button
          type="button"
          class="block w-full border-t border-slate-100 px-4 py-3 text-left text-sm text-slate-500"
          @click="logout"
        >
          Sign out
        </button>
      </div>
      <ul class="grid grid-cols-5">
        <li v-for="link in primary" :key="link.name">
          <RouterLink
            :to="{ name: link.name }"
            class="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
            :class="section === link.name ? 'text-indigo-700' : 'text-slate-500'"
            :aria-current="section === link.name ? 'page' : undefined"
          >
            <svg
              viewBox="0 0 24 24"
              class="size-6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path :d="link.icon" />
            </svg>
            {{ link.label }}
          </RouterLink>
        </li>
        <li>
          <button
            type="button"
            class="flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
            :class="moreActive || moreOpen ? 'text-indigo-700' : 'text-slate-500'"
            :aria-expanded="moreOpen"
            aria-controls="more-menu"
            @click="moreOpen = !moreOpen"
          >
            <svg viewBox="0 0 24 24" class="size-6" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="19" cy="12" r="1.75" />
            </svg>
            More
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>
