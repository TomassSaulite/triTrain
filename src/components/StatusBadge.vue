<script setup lang="ts">
import type { WorkoutStatus } from '@/api/types'
import { STATUSES } from '@/utils/sports'

defineProps<{ status: WorkoutStatus }>()
</script>

<template>
  <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="STATUSES[status].classes">
    {{ STATUSES[status].label }}
  </span>
</template>
