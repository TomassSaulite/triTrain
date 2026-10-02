<script setup lang="ts">
/**
 * The coach's notes on a plan (the warnings the generator raised), folded
 * into one panel so they inform without crowding out the plan itself.
 */
withDefaults(defineProps<{ notes: string[]; open?: boolean }>(), { open: false })
</script>

<template>
  <details
    v-if="notes.length"
    class="group rounded-lg bg-amber-50 text-sm text-amber-950 ring-1 ring-amber-200"
    :open="open"
  >
    <summary
      class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium [&::-webkit-details-marker]:hidden"
    >
      <span
        class="grid size-5 place-items-center rounded-full bg-amber-200 text-xs font-semibold tabular-nums"
        aria-hidden="true"
        >{{ notes.length }}</span
      >
      {{ notes.length === 1 ? 'A note from your coach' : `${notes.length} notes from your coach` }}
      <span class="ml-auto text-amber-700 transition group-open:rotate-180" aria-hidden="true">▾</span>
    </summary>
    <ul class="space-y-2 border-t border-amber-200 px-4 py-3">
      <li v-for="note in notes" :key="note" class="flex gap-2">
        <span class="text-amber-500" aria-hidden="true">•</span>
        <span>{{ note }}</span>
      </li>
    </ul>
    <p class="px-4 pb-3 text-xs text-amber-800">
      Change your weekly hours or schedule in
      <RouterLink :to="{ name: 'settings' }" class="font-medium underline">Settings</RouterLink>
      and the coach rebuilds the plan around them.
    </p>
  </details>
</template>
