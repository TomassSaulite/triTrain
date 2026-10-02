<script setup lang="ts">
import { useId } from 'vue'

/**
 * A labelled input with hint and error text. Use the default slot for
 * selects or custom controls; it receives the id to put on the control.
 */
const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    error?: string
    hint?: string
    placeholder?: string
    required?: boolean
    min?: number | string
    max?: number | string
    step?: number | string
    autocomplete?: string
  }>(),
  { type: 'text' },
)

const model = defineModel<string | number | null>()
const id = useId()
</script>

<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-slate-700">
      {{ props.label }}
      <span v-if="props.required" class="text-rose-600" aria-hidden="true">*</span>
    </label>
    <div class="mt-1">
      <slot :id="id">
        <input
          :id="id"
          v-model="model"
          :type="props.type"
          :placeholder="props.placeholder"
          :required="props.required"
          :min="props.min"
          :max="props.max"
          :step="props.step"
          :autocomplete="props.autocomplete"
          :aria-invalid="props.error ? 'true' : undefined"
          class="block w-full rounded-md border-0 px-3 py-2 text-sm shadow-xs ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600"
          :class="{ 'ring-rose-500': props.error }"
        />
      </slot>
    </div>
    <p v-if="props.error" class="mt-1 text-sm text-rose-600">{{ props.error }}</p>
    <p v-else-if="props.hint" class="mt-1 text-sm text-slate-500">{{ props.hint }}</p>
  </div>
</template>
