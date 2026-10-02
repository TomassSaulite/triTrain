<script setup lang="ts">
import type { Discipline } from '@/api/types'
import StepRow from './StepRow.vue'
import { newRepeat, newStep, type EditorBlock, type EditorStep } from './editor'

/** Edits a workout as a list of steps and repeat blocks. */
const props = defineProps<{ sport: Discipline }>()
const blocks = defineModel<EditorBlock[]>({ required: true })

function move<T>(list: T[], index: number, by: number): void {
  const [item] = list.splice(index, 1)
  list.splice(index + by, 0, item)
}

function addStep(list: (EditorBlock | EditorStep)[]): void {
  list.push(newStep(props.sport))
}
</script>

<template>
  <div class="space-y-2">
    <template v-for="(block, i) in blocks" :key="block.key">
      <div
        v-if="block.type === 'repeat'"
        class="space-y-2 rounded-md bg-slate-50 p-2 ring-1 ring-slate-200"
        role="group"
        :aria-label="`Repeat block ${i + 1}`"
      >
        <div class="flex items-center gap-2 text-sm">
          <span class="font-medium">Repeat</span>
          <input
            v-model.number="block.count"
            type="number"
            min="1"
            max="50"
            class="w-16 rounded-md px-2 py-1 ring-1 ring-slate-300"
            aria-label="Times"
          />
          <span class="text-slate-500">times</span>
          <div class="ml-auto flex gap-1">
            <button
              type="button"
              class="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              :disabled="i === 0"
              aria-label="Move repeat up"
              @click="move(blocks, i, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              class="rounded px-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              :disabled="i === blocks.length - 1"
              aria-label="Move repeat down"
              @click="move(blocks, i, 1)"
            >
              ↓
            </button>
            <button
              type="button"
              class="rounded px-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
              aria-label="Remove repeat"
              @click="blocks.splice(i, 1)"
            >
              ✕
            </button>
          </div>
        </div>
        <StepRow
          v-for="(step, j) in block.steps"
          :key="step.key"
          v-model="block.steps[j]"
          :label="`step ${j + 1} of repeat ${i + 1}`"
          :can-move-up="j > 0"
          :can-move-down="j < block.steps.length - 1"
          @up="move(block.steps, j, -1)"
          @down="move(block.steps, j, 1)"
          @remove="block.steps.splice(j, 1)"
        />
        <button
          type="button"
          class="text-sm font-medium text-indigo-600 hover:underline"
          @click="addStep(block.steps)"
        >
          + Step in repeat
        </button>
      </div>
      <StepRow
        v-else
        v-model="blocks[i] as EditorStep"
        :label="`step ${i + 1}`"
        :can-move-up="i > 0"
        :can-move-down="i < blocks.length - 1"
        @up="move(blocks, i, -1)"
        @down="move(blocks, i, 1)"
        @remove="blocks.splice(i, 1)"
      />
    </template>
    <div class="flex gap-4 pt-1">
      <button
        type="button"
        class="text-sm font-medium text-indigo-600 hover:underline"
        @click="addStep(blocks)"
      >
        + Step
      </button>
      <button
        type="button"
        class="text-sm font-medium text-indigo-600 hover:underline"
        @click="blocks.push(newRepeat(sport))"
      >
        + Repeat block
      </button>
    </div>
  </div>
</template>
