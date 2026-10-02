import { describe, expect, it } from 'vitest'
import { dialogState, settleDialog, useDialog } from './useDialog'

describe('useDialog', () => {
  it('resolves a confirm with the answer', async () => {
    const answer = useDialog().confirm({ title: 'Delete?' })

    expect(dialogState.open).toBe(true)
    expect(dialogState.title).toBe('Delete?')
    settleDialog(true)

    await expect(answer).resolves.toBe(true)
    expect(dialogState.open).toBe(false)
  })

  it('resolves a prompt with the typed text, or null when cancelled', async () => {
    const { prompt } = useDialog()

    const typed = prompt({ title: 'Why?', label: 'Reason', defaultValue: 'Because' })
    dialogState.input!.value = 'Busy week'
    settleDialog(true)
    await expect(typed).resolves.toBe('Busy week')

    const cancelled = prompt({ title: 'Why?', label: 'Reason' })
    settleDialog(false)
    await expect(cancelled).resolves.toBeNull()
  })

  it('cancels a dialog that is replaced by another', async () => {
    const { confirm } = useDialog()
    const first = confirm({ title: 'First' })
    const second = confirm({ title: 'Second', danger: true })

    await expect(first).resolves.toBe(false)
    expect(dialogState.title).toBe('Second')
    expect(dialogState.danger).toBe(true)
    settleDialog(true)
    await expect(second).resolves.toBe(true)
  })
})
