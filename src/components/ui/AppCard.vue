<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <section class="min-w-0 rounded-lg bg-white p-4 shadow-xs ring-1 ring-slate-200 sm:p-5">
    <header v-if="title || $slots.actions" class="mb-3 flex items-center justify-between gap-3">
      <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
      <div class="flex items-center gap-2"><slot name="actions" /></div>
    </header>
    <slot />
  </section>
</template>
