<script setup lang="ts">
import type { Sport } from '@/api/types'
import { SPORTS } from '@/utils/sports'

defineProps<{ sport: Sport }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
    :class="SPORTS[sport].soft"
  >
    <span class="size-1.5 rounded-full" :class="SPORTS[sport].dot" aria-hidden="true" />
    {{ SPORTS[sport].label }}
  </span>
</template>
