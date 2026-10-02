<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const ACTIVE = 'border-indigo-600! text-indigo-700!'

const links = [
  { to: { name: 'dashboard' }, label: 'Today', exact: true },
  { to: { name: 'calendar' }, label: 'Calendar' },
  { to: { name: 'plan' }, label: 'Plan' },
  { to: { name: 'races' }, label: 'Races' },
  { to: { name: 'activities' }, label: 'Activities' },
  { to: { name: 'settings' }, label: 'Settings' },
]

async function logout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center gap-6 px-4">
        <RouterLink :to="{ name: 'dashboard' }" class="py-3 text-lg font-bold tracking-tight text-indigo-700">
          TriTrain
        </RouterLink>
        <nav class="-mb-px flex flex-1 gap-1 overflow-x-auto" aria-label="Main">
          <RouterLink
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            class="border-b-2 border-transparent px-3 py-3.5 text-sm font-medium whitespace-nowrap text-slate-600 hover:text-slate-900"
            :active-class="link.exact ? '' : ACTIVE"
            :exact-active-class="ACTIVE"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
        <button class="text-sm text-slate-500 hover:text-slate-800" @click="logout">Sign out</button>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
