<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  { variant: 'primary', type: 'button', loading: false, disabled: false, size: 'md' },
)

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600',
  secondary: 'bg-surface text-slate-800 ring-1 ring-slate-300 ring-inset hover:bg-slate-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline-rose-600',
  ghost: 'text-slate-700 hover:bg-slate-100',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-md font-medium shadow-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    :class="[variants[variant], size === 'sm' ? 'px-2.5 py-1.5 text-sm' : 'px-3.5 py-2 text-sm']"
  >
    <span
      v-if="loading"
      class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
