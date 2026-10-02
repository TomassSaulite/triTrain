import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FeelForm from '@/components/feel/FeelForm.vue'
import { toasts } from '@/composables/useToast'

const rate = vi.fn()

vi.mock('@/api', () => ({
  activitiesApi: {
    rate: (...args: unknown[]) => rate(...args),
    unrate: vi.fn(),
  },
}))

describe('FeelForm', () => {
  afterEach(() => {
    rate.mockReset()
    toasts.splice(0)
  })

  it('sends the chosen ratings and passes on what the coach changed', async () => {
    const saved = {
      id: 1,
      activity_id: 7,
      rpe: 7,
      muscles: 4,
      breathing: null,
      energy: null,
      mood: null,
      pain: true,
    }
    rate.mockResolvedValue({ data: saved, plan_change: 'Long run on Saturday swapped for recovery.' })
    const wrapper = mount(FeelForm, { props: { activityId: 7 } })

    expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()

    await wrapper.get('input[value="7"]').setValue()
    const muscles = wrapper.findAll('fieldset')[1]
    await muscles.findAll('input')[3].setValue()
    await wrapper.get('input[type=checkbox]').setValue(true)
    await wrapper.get('input[type=text]').setValue('left calf')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(rate).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ rpe: 7, muscles: 4, pain: true, pain_area: 'left calf' }),
    )
    expect(wrapper.emitted('saved')?.[0]).toEqual([saved])
    expect(toasts.at(-1)?.message).toContain('The coach adjusted your plan: Long run on Saturday')
  })

  it('drops the pain area when pain is unticked', async () => {
    rate.mockResolvedValue({ data: {}, plan_change: null })
    const wrapper = mount(FeelForm, {
      props: {
        activityId: 7,
        feedback: {
          id: 1,
          activity_id: 7,
          rpe: 5,
          muscles: null,
          breathing: null,
          energy: null,
          mood: null,
          pain: true,
          pain_area: 'knee',
          note: null,
          updated_at: '',
        },
      },
    })

    await wrapper.get('input[type=checkbox]').setValue(false)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(rate).toHaveBeenCalledWith(7, expect.objectContaining({ pain: false, pain_area: null }))
  })
})
