<script setup lang="ts">
import { dismissToast, toasts, type Toast } from '@/composables/useToast'

const tones = {
  success: 'bg-slate-900 text-white',
  info: 'bg-slate-900 text-white',
  error: 'bg-rose-700 text-white',
}

async function act(toast: Toast): Promise<void> {
  dismissToast(toast.id)
  await toast.action?.run()
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
    aria-live="polite"
  >
    <TransitionGroup
      enter-from-class="translate-y-2 opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-150"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :role="toast.tone === 'error' ? 'alert' : 'status'"
        class="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg"
        :class="tones[toast.tone]"
      >
        <p class="flex-1">{{ toast.message }}</p>
        <button
          v-if="toast.action"
          type="button"
          class="font-semibold text-indigo-300 hover:text-indigo-200"
          @click="act(toast)"
        >
          {{ toast.action.label }}
        </button>
        <button
          type="button"
          class="text-white/60 hover:text-white"
          aria-label="Dismiss"
          @click="dismissToast(toast.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
