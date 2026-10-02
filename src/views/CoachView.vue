<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { coachApi } from '@/api'
import type { CoachMessage } from '@/api/types'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppButton from '@/components/ui/AppButton.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import { errorMessage, useAsync } from '@/composables/useAsync'
import { useDialog } from '@/composables/useDialog'

const { confirm } = useDialog()

const conversation = useAsync(() => coachApi.conversation())
const messages = ref<CoachMessage[]>([])
const draft = ref('')
const sending = ref(false)
const error = ref<string | null>(null)
const list = ref<HTMLElement | null>(null)
const input = ref<HTMLTextAreaElement | null>(null)

watch(
  () => conversation.data.value,
  (value) => {
    messages.value = value?.data ?? []
    void scrollToEnd()
  },
)

const driver = computed(() => conversation.data.value?.meta.driver ?? 'rules')
const suggestions = computed(() => conversation.data.value?.meta.suggestions ?? [])

const DRIVERS = {
  rules: 'Built-in coach: answers the common questions from your plan and data.',
  claude:
    'AI coach (Claude): ask anything about your training. It sees your plan, sessions, load, ratings and races.',
  ollama:
    'AI coach (open model): ask anything about your training. It sees your plan, sessions, load, ratings and races.',
} as const

async function scrollToEnd(): Promise<void> {
  await nextTick()
  list.value?.scrollTo({ top: list.value.scrollHeight, behavior: 'smooth' })
}

async function send(text: string = draft.value): Promise<void> {
  const message = text.trim()
  if (!message || sending.value) return

  // Show the question straight away; the stored copy replaces it when the reply arrives.
  const pending: CoachMessage = {
    id: -Date.now(),
    role: 'athlete',
    content: message,
    driver: null,
    created_at: '',
  }
  messages.value = [...messages.value, pending]
  draft.value = ''
  sending.value = true
  error.value = null
  void scrollToEnd()

  try {
    const { question, reply } = await coachApi.ask(message)
    messages.value = [...messages.value.filter((m) => m.id !== pending.id), question, reply]
  } catch (e) {
    messages.value = messages.value.filter((m) => m.id !== pending.id)
    draft.value = message
    error.value = errorMessage(e)
  } finally {
    sending.value = false
    void scrollToEnd()
    input.value?.focus()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    void send()
  }
}

async function clear(): Promise<void> {
  if (
    !(await confirm({
      title: 'Clear the conversation?',
      message: 'Your plan stays as it is.',
      confirmLabel: 'Clear',
      danger: true,
    }))
  )
    return
  await coachApi.clear()
  messages.value = []
}

/** Coach replies use plain lines and "- " bullets; render them as paragraphs and lists. */
function blocks(content: string): { list: boolean; lines: string[] }[] {
  const result: { list: boolean; lines: string[] }[] = []
  for (const line of content.split('\n').filter((l) => l.trim() !== '')) {
    const isItem = /^\s*[-*•]\s+/.test(line)
    const text = line.replace(/^\s*[-*•]\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1')
    const last = result.at(-1)
    if (last && last.list && isItem) last.lines.push(text)
    else result.push({ list: isItem, lines: [text] })
  }
  return result
}
</script>

<template>
  <LoadingState
    :loading="conversation.loading.value"
    :error="conversation.error.value"
    @retry="conversation.run"
  >
    <div class="mx-auto flex h-[calc(100dvh-11rem)] max-w-3xl flex-col md:h-[calc(100dvh-8rem)]">
      <header class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 class="text-xl font-semibold">Coach</h1>
          <p class="text-sm text-slate-500">{{ DRIVERS[driver] }}</p>
        </div>
        <AppButton v-if="messages.length" variant="ghost" size="sm" @click="clear">Clear</AppButton>
      </header>

      <div
        ref="list"
        class="mt-4 flex-1 space-y-3 overflow-y-auto rounded-lg bg-white p-4 ring-1 ring-slate-200"
        role="log"
        aria-live="polite"
        aria-label="Conversation with your coach"
      >
        <div v-if="messages.length === 0" class="py-8 text-center text-sm text-slate-500">
          <p class="text-base font-medium text-slate-800">Ask your coach anything about your training.</p>
          <p class="mt-1">Try one of these to start:</p>
        </div>

        <div
          v-for="m in messages"
          :key="m.id"
          class="flex"
          :class="m.role === 'athlete' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
            :class="
              m.role === 'athlete'
                ? 'rounded-br-sm bg-indigo-600 text-white'
                : 'rounded-bl-sm bg-slate-100 text-slate-900'
            "
          >
            <template v-for="(b, i) in blocks(m.content)" :key="i">
              <ul v-if="b.list" class="my-1 list-disc space-y-0.5 pl-5">
                <li v-for="line in b.lines" :key="line">{{ line }}</li>
              </ul>
              <p v-else class="[&:not(:first-child)]:mt-1.5">{{ b.lines[0] }}</p>
            </template>
            <p
              v-if="m.role === 'coach' && m.driver === 'rules' && driver !== 'rules'"
              class="mt-1.5 text-xs text-slate-500"
            >
              The AI coach was unavailable, so the built-in coach answered.
            </p>
          </div>
        </div>

        <div v-if="sending" class="flex justify-start" aria-label="Coach is typing">
          <div class="flex gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
            <span v-for="i in 3" :key="i" class="typing-dot size-1.5 rounded-full bg-slate-400" />
          </div>
        </div>
      </div>

      <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="s in suggestions"
          :key="s"
          type="button"
          class="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
          :disabled="sending"
          @click="send(s)"
        >
          {{ s }}
        </button>
      </div>

      <AppAlert v-if="error" tone="error" class="mt-2">{{ error }}</AppAlert>

      <form class="mt-2 flex items-end gap-2" @submit.prevent="send()">
        <label class="sr-only" for="coach-message">Message your coach</label>
        <textarea
          id="coach-message"
          ref="input"
          v-model="draft"
          rows="1"
          maxlength="2000"
          placeholder="Ask your coach…"
          class="max-h-32 min-h-11 flex-1 resize-none rounded-xl bg-white px-4 py-2.5 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          @keydown="onKeydown"
        />
        <AppButton type="submit" :loading="sending" :disabled="!draft.trim()" class="h-11">Send</AppButton>
      </form>
    </div>
  </LoadingState>
</template>

<style scoped>
.typing-dot {
  animation: typing 1.2s infinite ease-in-out;
}
.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-2px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .typing-dot {
    animation: none;
  }
}
</style>
