import { reactive } from 'vue'

export interface ToastAction {
  label: string
  run: () => void | Promise<void>
}

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
  action?: ToastAction
}

const DURATION_MS = 5000
const WITH_ACTION_MS = 8000

let nextId = 1

/** The toasts on screen, newest last; AppToaster renders them. */
export const toasts = reactive<Toast[]>([])

export function dismissToast(id: number): void {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

function show(message: string, tone: Toast['tone'], action?: ToastAction): number {
  const id = nextId++
  toasts.push({ id, message, tone, action })
  setTimeout(() => dismissToast(id), action ? WITH_ACTION_MS : DURATION_MS)

  return id
}

/** Short-lived feedback after an action, optionally with an undo-style action. */
export function useToast() {
  return {
    success: (message: string, action?: ToastAction) => show(message, 'success', action),
    error: (message: string) => show(message, 'error'),
    info: (message: string, action?: ToastAction) => show(message, 'info', action),
  }
}
