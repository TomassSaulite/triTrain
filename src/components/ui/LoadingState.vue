<script setup lang="ts">
defineProps<{ loading: boolean; error?: string | null }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div v-if="loading" class="flex justify-center py-10" role="status" aria-label="Loading">
    <span class="size-6 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
  </div>
  <div v-else-if="error" class="space-y-2 py-6 text-center">
    <p class="text-sm text-rose-700">{{ error }}</p>
    <button class="text-sm font-medium text-indigo-600 hover:underline" @click="$emit('retry')">
      Try again
    </button>
  </div>
  <slot v-else />
</template>
