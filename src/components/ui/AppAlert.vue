<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'info' | 'warning' | 'error' | 'success' }>(), { tone: 'info' })

const tones = {
  info: 'bg-sky-50 text-sky-900 ring-sky-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  error: 'bg-rose-50 text-rose-900 ring-rose-200',
  success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
}
</script>

<template>
  <div
    :role="tone === 'error' ? 'alert' : 'status'"
    class="rounded-md px-3 py-2 text-sm ring-1"
    :class="tones[tone]"
  >
    <slot />
  </div>
</template>
