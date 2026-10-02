import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Styles the confirm button as destructive. */
  danger?: boolean
}

export interface PromptOptions extends ConfirmOptions {
  label: string
  defaultValue?: string
}

interface DialogState extends ConfirmOptions {
  open: boolean
  input: { label: string; value: string } | null
  resolve: ((value: string | boolean | null) => void) | null
}

/** The one dialog the app shows at a time; AppDialog renders it. */
export const dialogState = reactive<DialogState>({ open: false, title: '', input: null, resolve: null })

function show(options: ConfirmOptions, input: DialogState['input']): Promise<string | boolean | null> {
  // A dialog still open is answered "cancel" before the next one replaces it.
  dialogState.resolve?.(input ? null : false)

  return new Promise((resolve) => {
    Object.assign(
      dialogState,
      { message: undefined, confirmLabel: undefined, cancelLabel: undefined, danger: false },
      options,
      {
        open: true,
        input,
        resolve,
      },
    )
  })
}

/** Settles the open dialog: true / the typed text when confirmed, false / null when cancelled. */
export function settleDialog(confirmed: boolean): void {
  const { resolve, input } = dialogState
  dialogState.open = false
  dialogState.resolve = null
  resolve?.(input ? (confirmed ? input.value : null) : confirmed)
}

export function useDialog() {
  return {
    confirm: (options: ConfirmOptions) => show(options, null) as Promise<boolean>,
    prompt: (options: PromptOptions) =>
      show(options, { label: options.label, value: options.defaultValue ?? '' }) as Promise<string | null>,
  }
}
