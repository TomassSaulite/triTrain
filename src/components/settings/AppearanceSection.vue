<script setup lang="ts">
import { ref } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import { getTheme, setTheme, type ThemePreference } from '@/utils/theme'

const theme = ref<ThemePreference>(getTheme())
const OPTIONS: { value: ThemePreference; label: string; hint: string }[] = [
  { value: 'system', label: 'Automatic', hint: 'Follows your device' },
  { value: 'light', label: 'Light', hint: 'Always light' },
  { value: 'dark', label: 'Dark', hint: 'Always dark' },
]

function pick(value: ThemePreference): void {
  theme.value = value
  setTheme(value)
}
</script>

<template>
  <AppCard id="appearance" title="Appearance">
    <fieldset>
      <legend class="mb-3 text-sm text-slate-600">Theme on this device</legend>
      <div class="grid gap-2 sm:grid-cols-3">
        <label v-for="o in OPTIONS" :key="o.value" class="cursor-pointer">
          <input
            type="radio"
            name="theme"
            :value="o.value"
            :checked="theme === o.value"
            class="peer sr-only"
            @change="pick(o.value)"
          />
          <span
            class="block rounded-md px-3 py-2 ring-1 ring-slate-300 peer-checked:ring-2 peer-checked:ring-indigo-600 peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-600"
          >
            <span class="block text-sm font-medium text-slate-900">{{ o.label }}</span>
            <span class="block text-xs text-slate-500">{{ o.hint }}</span>
          </span>
        </label>
      </div>
    </fieldset>
  </AppCard>
</template>
