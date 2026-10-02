import { describe, expect, it } from 'vitest'
import type { SessionFeedback } from '@/api/types'
import { feelSummary, levelLabel, rpeLabel } from './feel'

describe('feel', () => {
  it('names ratings on each scale', () => {
    expect(levelLabel('muscles', 4)).toBe('Heavy')
    expect(levelLabel('energy', 1)).toBe('Great')
    expect(rpeLabel(10)).toBe('Maximal')
    expect(rpeLabel(3.4)).toBe('Moderate')
  })

  it('sums up a rating in one line', () => {
    const feedback = {
      rpe: 7,
      muscles: 4,
      breathing: null,
      energy: 2,
      mood: null,
      pain: true,
      pain_area: 'knee',
    }

    expect(feelSummary(feedback as SessionFeedback)).toBe('Effort 7 · legs heavy · energy good · pain (knee)')
  })
})
