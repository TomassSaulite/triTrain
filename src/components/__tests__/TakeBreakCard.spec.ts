import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TakeBreakCard from '@/components/TakeBreakCard.vue'
import { toasts } from '@/composables/useToast'
import { addDays, today } from '@/utils/dates'

const takeBreak = vi.fn()

vi.mock('@/api', () => ({
  availabilityApi: { takeBreak: (...args: unknown[]) => takeBreak(...args) },
}))

describe('TakeBreakCard', () => {
  afterEach(() => {
    takeBreak.mockReset()
    toasts.splice(0)
  })

  it('takes a few days off for the chosen reason', async () => {
    takeBreak.mockResolvedValue([])
    const wrapper = mount(TakeBreakCard)

    await wrapper.get('button').trigger('click')
    await wrapper.get('input[value=injured]').setValue()
    await wrapper
      .findAll('button')
      .find((b) => b.text() === '3 days')!
      .trigger('click')
    await wrapper.get('input[placeholder^="e.g."]').setValue('Sore knee')
    expect(wrapper.get('button[type=submit]').text()).toBe('Take 3 days off')

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(takeBreak).toHaveBeenCalledWith({
      from: today(),
      to: addDays(today(), 2),
      reason: 'injured',
      note: 'Sore knee',
    })
    expect(wrapper.emitted('done')).toHaveLength(1)
    expect(toasts.at(-1)?.message).toContain('3 days off')
    expect(wrapper.find('form').exists()).toBe(false)
  })
})
