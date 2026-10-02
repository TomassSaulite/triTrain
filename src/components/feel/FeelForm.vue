<script setup lang="ts">
import { reactive, useId, watch } from 'vue'
import { activitiesApi } from '@/api'
import type { SessionFeedback, SessionFeedbackInput } from '@/api/types'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useForm } from '@/composables/useForm'
import { useToast } from '@/composables/useToast'
import { useUnratedStore } from '@/stores/unrated'
import { FEEL_SCALES, RPE_LEVELS } from '@/utils/feel'

/**
 * "How did it feel?": overall effort plus muscles, breathing, energy and mood.
 * Saving hands the rating to the coach, which may change the plan.
 */
const props = defineProps<{ activityId: number; feedback?: SessionFeedback | null }>()
const emit = defineEmits<{ saved: [feedback: SessionFeedback]; removed: [] }>()

const id = useId()
const toast = useToast()
const unrated = useUnratedStore()
const { submitting, error, submit } = useForm()

function fromFeedback(f?: SessionFeedback | null): SessionFeedbackInput {
  return {
    rpe: f?.rpe ?? 0,
    muscles: f?.muscles ?? null,
    breathing: f?.breathing ?? null,
    energy: f?.energy ?? null,
    mood: f?.mood ?? null,
    pain: f?.pain ?? false,
    pain_area: f?.pain_area ?? null,
    note: f?.note ?? null,
  }
}

const draft = reactive(fromFeedback(props.feedback))
watch(
  () => props.feedback,
  (f) => Object.assign(draft, fromFeedback(f)),
)

async function save(): Promise<void> {
  const result = await submit(() =>
    activitiesApi.rate(props.activityId, { ...draft, pain_area: draft.pain ? draft.pain_area : null }),
  )
  if (!result) return

  emit('saved', result.data)
  void unrated.refresh()
  if (result.plan_change) {
    toast.info(`Thanks. The coach adjusted your plan: ${result.plan_change}`)
  } else {
    toast.success('Thanks, the coach has your rating.')
  }
}

async function remove(): Promise<void> {
  if ((await submit(() => activitiesApi.unrate(props.activityId))) === undefined) return

  Object.assign(draft, fromFeedback(null))
  emit('removed')
  void unrated.refresh()
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="save">
    <fieldset>
      <legend class="text-sm font-medium text-slate-800">Overall effort</legend>
      <div class="mt-2 grid grid-cols-10 gap-1">
        <label v-for="n in 10" :key="n" class="cursor-pointer">
          <input
            v-model="draft.rpe"
            type="radio"
            :name="`${id}-rpe`"
            :value="n"
            class="peer sr-only"
            required
          />
          <span
            class="block rounded-md py-2 text-center text-sm font-medium tabular-nums ring-1 ring-slate-300 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:ring-indigo-600 peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-600 hover:bg-slate-50 peer-checked:hover:bg-indigo-600"
            >{{ n }}</span
          >
        </label>
      </div>
      <p class="mt-1 flex justify-between text-xs text-slate-500">
        <span>Very easy</span>
        <span v-if="draft.rpe" class="font-medium text-slate-700">{{ RPE_LEVELS[draft.rpe - 1] }}</span>
        <span>Maximal</span>
      </p>
    </fieldset>

    <fieldset v-for="scale in FEEL_SCALES" :key="scale.key">
      <legend class="text-sm font-medium text-slate-800">
        {{ scale.label }} <span class="font-normal text-slate-500">· {{ scale.question }}</span>
      </legend>
      <div class="mt-2 grid grid-cols-5 gap-1">
        <label v-for="(level, i) in scale.levels" :key="level" class="cursor-pointer">
          <input
            v-model="draft[scale.key]"
            type="radio"
            :name="`${id}-${scale.key}`"
            :value="i + 1"
            class="peer sr-only"
          />
          <span
            class="block rounded-md px-1 py-2 text-center text-xs leading-tight ring-1 ring-slate-300 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:ring-indigo-600 peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-600 hover:bg-slate-50 peer-checked:hover:bg-indigo-600"
            >{{ level }}</span
          >
        </label>
      </div>
    </fieldset>

    <div class="space-y-2">
      <label class="flex items-center gap-2 text-sm font-medium text-slate-800">
        <input v-model="draft.pain" type="checkbox" class="size-4 rounded accent-indigo-600" />
        Something hurt
      </label>
      <label v-if="draft.pain" class="block text-sm">
        <span class="text-slate-600">Where?</span>
        <input
          v-model="draft.pain_area"
          type="text"
          maxlength="60"
          placeholder="e.g. left knee"
          class="mt-1 w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300 sm:w-64"
        />
      </label>
      <p v-if="draft.pain" class="text-xs text-slate-500">
        The coach will ease your next hard session of this sport.
      </p>
    </div>

    <label class="block text-sm">
      <span class="font-medium text-slate-800">Note</span>
      <textarea
        v-model="draft.note"
        rows="2"
        maxlength="1000"
        placeholder="Anything worth remembering?"
        class="mt-1 w-full rounded-md px-3 py-2 text-sm ring-1 ring-slate-300"
      />
    </label>

    <AppAlert v-if="error" tone="error">{{ error }}</AppAlert>

    <div class="flex items-center gap-2">
      <AppButton type="submit" :loading="submitting" :disabled="!draft.rpe">
        {{ feedback ? 'Update rating' : 'Save rating' }}
      </AppButton>
      <AppButton v-if="feedback" variant="ghost" :disabled="submitting" @click="remove">Remove</AppButton>
    </div>
  </form>
</template>
