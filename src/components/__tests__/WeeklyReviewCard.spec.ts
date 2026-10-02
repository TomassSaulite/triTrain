import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WeeklyReviewCard from '@/components/WeeklyReviewCard.vue'
import type { WeeklyReview } from '@/api/types'

const review: WeeklyReview = {
  week_start: '2026-10-12',
  week_end: '2026-10-18',
  phase: 'base',
  is_recovery: false,
  finished: true,
  verdict: 'keys_missed',
  headline: 'You did 90% of the planned load but missed a key session.',
  notes: ['Fitness rose from 60 to 63.'],
  next_week: 'Next week the load goes up about 8% (8 h 40 and 455 TSS).',
  planned: { tss: 421, duration_s: 30600, sessions: 8 },
  actual: { tss: 379, duration_s: 28800, activities: 7 },
  compliance: 0.9,
  key_sessions: { planned: 3, done: 2, missed: ['Long run'] },
  fitness: { ctl_before: 60.2, ctl_after: 62.9, tsb_after: -8 },
  feel: {
    sessions: 7,
    rated: 5,
    rpe: 5.8,
    muscles: 3.2,
    breathing: 2.4,
    energy: 2.6,
    mood: 2,
    pain_reports: 0,
  },
  coach_changes: [
    { version: 5, summary: 'Moved the long run to Sunday.', created_at: '2026-10-14T06:00:00Z' },
  ],
}

describe('WeeklyReviewCard', () => {
  it("shows the coach's verdict, numbers, notes and next week", () => {
    const text = mount(WeeklyReviewCard, { props: { review } }).text()

    expect(text).toContain('Your week in review')
    expect(text).toContain('Key session missed')
    expect(text).toContain(review.headline)
    expect(text).toContain('90%')
    expect(text).toContain('2 of 3')
    expect(text).toContain('Fitness rose from 60 to 63.')
    expect(text).toContain(review.next_week)
    expect(text).toContain('The coach adjusted your plan once')
    expect(text).toContain('How it felt (5 of 7 rated)')
    expect(text).toContain('Effort 5.8')
    expect(text).toContain('Muscles 3.2 Tired')
  })

  it('says "so far" for a week still under way and hides empty parts', () => {
    const text = mount(WeeklyReviewCard, {
      props: {
        review: {
          ...review,
          finished: false,
          compliance: null,
          key_sessions: { planned: 0, done: 0, missed: [] },
          coach_changes: [],
        },
      },
    }).text()

    expect(text).toContain('Your week so far')
    expect(text).not.toContain('Planned load done')
    expect(text).not.toContain('Key sessions')
    expect(text).not.toContain('adjusted your plan')
  })

  it('emits dismiss from "Got it"', async () => {
    const wrapper = mount(WeeklyReviewCard, { props: { review } })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })
})
