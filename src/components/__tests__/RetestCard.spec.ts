import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import RetestCard from '@/components/RetestCard.vue'
import type { ThresholdStatus } from '@/api/types'

const status = (
  metric: ThresholdStatus['metric'],
  s: ThresholdStatus['status'],
  age: number | null = null,
): ThresholdStatus => ({
  metric,
  value: s === 'missing' ? null : 250,
  tested_at: s === 'missing' ? null : '2026-07-01',
  source: s === 'missing' ? null : 'test',
  age_days: age,
  status: s,
  protocol: `How to test ${metric}`,
})

const mountCard = (statuses: ThresholdStatus[]) =>
  mount(RetestCard, {
    props: { statuses },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })

describe('RetestCard', () => {
  beforeEach(() => localStorage.clear())

  it('prompts for old and missing thresholds, but not a missing heart rate', () => {
    const text = mountCard([
      status('ftp_w', 'due', 79),
      status('threshold_pace_s_per_km', 'ok', 10),
      status('css_s_per_100m', 'missing'),
      status('lthr', 'missing'),
    ]).text()

    expect(text).toContain('Time to retest your FTP')
    expect(text).toContain('last set 11 weeks ago')
    expect(text).toContain('Add your Critical swim speed')
    expect(text).not.toContain('Threshold run pace')
    expect(text).not.toContain('heart rate')
  })

  it('stays dismissed for that value', async () => {
    const statuses = [status('ftp_w', 'due', 79)]
    const wrapper = mountCard(statuses)

    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toBe('')
    expect(mountCard(statuses).text()).toBe('')
  })
})
