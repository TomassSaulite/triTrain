<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import { dialogState, settleDialog } from '@/composables/useDialog'
import AppButton from './AppButton.vue'

/**
 * Renders the dialog requested through useDialog() with the native <dialog>
 * element, which traps focus, closes on Escape and shows a backdrop.
 */
const element = ref<HTMLDialogElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const titleId = useId()
const inputId = useId()

watch(
  () => dialogState.open,
  async (open) => {
    await nextTick()
    if (!element.value) return

    if (open && !element.value.open) {
      element.value.showModal?.()
      input.value?.select()
    } else if (!open && element.value.open) {
      element.value.close()
    }
  },
)
</script>

<template>
  <dialog
    ref="element"
    :aria-labelledby="titleId"
    class="m-auto w-[min(28rem,calc(100%-2rem))] rounded-lg bg-surface p-0 shadow-xl ring-1 ring-slate-200 backdrop:bg-slate-900/40"
    @cancel.prevent="settleDialog(false)"
  >
    <form v-if="dialogState.open" method="dialog" class="space-y-4 p-5" @submit.prevent="settleDialog(true)">
      <h2 :id="titleId" class="text-base font-semibold text-slate-900">{{ dialogState.title }}</h2>
      <p v-if="dialogState.message" class="text-sm text-slate-600">{{ dialogState.message }}</p>
      <div v-if="dialogState.input">
        <label :for="inputId" class="block text-sm font-medium text-slate-700">{{
          dialogState.input.label
        }}</label>
        <input
          :id="inputId"
          ref="input"
          v-model="dialogState.input.value"
          class="mt-1 block w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-600"
        />
      </div>
      <div class="flex justify-end gap-2">
        <AppButton variant="ghost" @click="settleDialog(false)">{{
          dialogState.cancelLabel ?? 'Cancel'
        }}</AppButton>
        <AppButton type="submit" :variant="dialogState.danger ? 'danger' : 'primary'">
          {{ dialogState.confirmLabel ?? 'OK' }}
        </AppButton>
      </div>
    </form>
  </dialog>
</template>
