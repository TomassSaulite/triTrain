import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dismissToast, toasts, useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    toasts.splice(0)
    vi.useRealTimers()
  })

  it('shows a toast and hides it after a while', () => {
    useToast().success('Saved')
    expect(toasts.map((t) => t.message)).toEqual(['Saved'])

    vi.advanceTimersByTime(5000)
    expect(toasts).toHaveLength(0)
  })

  it('keeps a toast with an action on screen longer', () => {
    useToast().success('Moved', { label: 'Undo', run: () => {} })

    vi.advanceTimersByTime(5000)
    expect(toasts).toHaveLength(1)
    vi.advanceTimersByTime(3000)
    expect(toasts).toHaveLength(0)
  })

  it('dismisses one toast by id', () => {
    const { info } = useToast()
    const first = info('One')
    info('Two')

    dismissToast(first)
    expect(toasts.map((t) => t.message)).toEqual(['Two'])
  })
})
