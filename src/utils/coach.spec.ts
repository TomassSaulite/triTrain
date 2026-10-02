import { describe, expect, it } from 'vitest'
import type { PhaseType, WeekProgress } from '@/api/types'
import { weekFocus } from './coach'

function week(start: string, phase: PhaseType, isRecovery = false): WeekProgress {
  return { start_date: start, phase, is_recovery: isRecovery } as WeekProgress
}

const weeks = [
  week('2026-10-05', 'base'),
  week('2026-10-12', 'base'),
  week('2026-10-19', 'base', true),
  week('2026-10-26', 'build'),
]

describe('weekFocus', () => {
  it('places the week within its phase', () => {
    expect(weekFocus(weeks, '2026-10-12')).toMatchObject({ phase: 'base', week: 2, weeksInPhase: 3 })
    expect(weekFocus(weeks, '2026-10-26')).toMatchObject({ phase: 'build', week: 1, weeksInPhase: 1 })
  })

  it('explains a recovery week', () => {
    expect(weekFocus(weeks, '2026-10-19')?.message).toMatch(/^Recovery week/)
  })

  it('returns null outside the plan', () => {
    expect(weekFocus(weeks, '2027-01-04')).toBeNull()
  })
})
