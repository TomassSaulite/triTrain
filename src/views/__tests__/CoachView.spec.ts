import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CoachView from '@/views/CoachView.vue'

const ask = vi.fn()

vi.mock('@/api', () => ({
  coachApi: {
    conversation: () =>
      Promise.resolve({ data: [], meta: { driver: 'rules', suggestions: ["What's my session today?"] } }),
    ask: (...args: unknown[]) => ask(...args),
    clear: vi.fn(),
  },
}))

// jsdom has no scrolling.
Element.prototype.scrollTo = () => {}

const message = (id: number, role: 'athlete' | 'coach', content: string) => ({
  id,
  role,
  content,
  driver: role === 'coach' ? 'rules' : null,
  created_at: '2026-10-07T08:00:00Z',
})

describe('CoachView', () => {
  afterEach(() => ask.mockReset())

  it('asks a suggested question and shows the reply, with bullets as a list', async () => {
    ask.mockResolvedValue({
      question: message(1, 'athlete', "What's my session today?"),
      reply: message(2, 'coach', 'Today you have:\n- Bike: Tempo intervals\n- Run: Easy run'),
    })
    const wrapper = mount(CoachView)
    await flushPromises()

    expect(wrapper.text()).toContain('Built-in coach')
    await wrapper.get('button[type=button]:not([disabled])').trigger('click')
    await flushPromises()

    expect(ask).toHaveBeenCalledWith("What's my session today?")
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual(['Bike: Tempo intervals', 'Run: Easy run'])
    expect(wrapper.text()).toContain('Today you have:')
  })

  it('gives the text back when sending fails', async () => {
    ask.mockRejectedValue(new Error('Too many requests.'))
    const wrapper = mount(CoachView)
    await flushPromises()

    await wrapper.get('textarea').setValue('Can I race on Sunday?')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Too many requests.')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Can I race on Sunday?')
  })
})
