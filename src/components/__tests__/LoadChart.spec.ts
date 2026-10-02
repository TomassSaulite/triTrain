import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LoadChart from '@/components/charts/LoadChart.vue'
import type { DailyLoad } from '@/api/types'

class NoopObserver {
  observe() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver

const points: DailyLoad[] = [
  { date: '2026-10-01', tss: 80, ctl: 50, atl: 60, tsb: -5 },
  { date: '2026-10-02', tss: 0, ctl: 48.8, atl: 51.4, tsb: -10 },
]

describe('LoadChart', () => {
  it('describes the latest values for screen readers and labels the lines', () => {
    const wrapper = mount(LoadChart, { props: { points } })

    expect(wrapper.find('svg').attributes('aria-label')).toContain('Fitness 49, fatigue 51, form -10')
    expect(wrapper.text()).toContain('Fitness 49')
    expect(wrapper.text()).toContain('Fatigue 51')
  })

  it('offers the same data as a table', async () => {
    const wrapper = mount(LoadChart, { props: { points } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('says when there is nothing to draw', () => {
    expect(mount(LoadChart, { props: { points: [] } }).text()).toContain('Log or sync a few activities')
  })
})
