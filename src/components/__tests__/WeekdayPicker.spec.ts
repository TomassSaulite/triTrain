import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WeekdayPicker from '@/components/forms/WeekdayPicker.vue'

describe('WeekdayPicker', () => {
  it('toggles days in multiple mode and keeps them sorted', async () => {
    const wrapper = mount(WeekdayPicker, { props: { label: 'Pool days', multiple: true, modelValue: [5] } })

    await wrapper.findAll('button')[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([[2, 5]])
  })

  it('picks a single day, and none when allowed', async () => {
    const wrapper = mount(WeekdayPicker, { props: { label: 'Long run', allowNone: true, modelValue: 4 } })

    await wrapper.findAll('button')[3].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])

    await wrapper.findAll('button')[6].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([7])
  })

  it('cannot pick disabled days', () => {
    const wrapper = mount(WeekdayPicker, { props: { label: 'Long ride', modelValue: 6, disabledDays: [1] } })

    expect(wrapper.findAll('button')[0].attributes('disabled')).toBeDefined()
  })
})
