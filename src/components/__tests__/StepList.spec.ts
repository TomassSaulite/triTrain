import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StepList from '@/components/StepList.vue'
import type { StructureBlock } from '@/api/types'

const blocks: StructureBlock[] = [
  {
    type: 'warmup',
    duration_s: 900,
    target: { metric: 'ftp_pct', low: 0.55, high: 0.65 },
    resolved: { unit: 'watts', low: 138, high: 163 },
  },
  {
    type: 'repeat',
    count: 3,
    steps: [
      {
        type: 'interval',
        duration_s: 600,
        target: { metric: 'ftp_pct', low: 0.88, high: 0.93 },
        resolved: null,
      },
      { type: 'rest', duration_s: 60 },
    ],
  },
]

describe('StepList', () => {
  it('shows absolute targets next to relative ones and nests repeats', () => {
    const text = mount(StepList, { props: { blocks } }).text()

    expect(text).toContain('Warmup · 15 min')
    expect(text).toContain('138–163 W')
    expect(text).toContain('55–65% FTP')
    expect(text).toContain('3 ×')
    expect(text).toContain('88–93% FTP')
    expect(text).toContain('Rest')
  })
})
