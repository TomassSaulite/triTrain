import { describe, expect, it } from 'vitest'
import type { WorkoutStructure } from '@/api/types'
import { fromStructure, starterBlocks, timedSeconds, toStructure, validateBlocks } from './editor'

const sweetSpot: WorkoutStructure = {
  steps: [
    { type: 'warmup', duration_s: 900, target: { metric: 'ftp_pct', low: 0.55, high: 0.65 } },
    {
      type: 'repeat',
      count: 3,
      steps: [
        { type: 'interval', duration_s: 600, target: { metric: 'ftp_pct', low: 0.88, high: 0.93 } },
        { type: 'rest', duration_s: 60 },
      ],
    },
    { type: 'cooldown', duration_s: 600, target: { metric: 'ftp_pct', low: 0.5, high: 0.6 } },
  ],
}

describe('workout editor model', () => {
  it('round-trips the API structure', () => {
    expect(toStructure(fromStructure(sweetSpot, 'bike'))).toEqual(sweetSpot)
  })

  it('works in minutes and percent for editing', () => {
    const [warmup] = fromStructure(sweetSpot, 'bike')

    expect(warmup).toMatchObject({ measure: 'time', amount: 15, low: 55, high: 65 })
  })

  it('expands repeats nested more than one level deep', () => {
    const nested: WorkoutStructure = {
      steps: [
        {
          type: 'repeat',
          count: 2,
          steps: [
            {
              type: 'repeat',
              count: 2,
              steps: [{ type: 'interval', duration_s: 60, target: { metric: 'ftp_pct', low: 1, high: 1.1 } }],
            },
          ],
        },
      ],
    }

    const [block] = fromStructure(nested, 'bike')

    expect(block.type === 'repeat' && block.steps).toHaveLength(2)
    expect(timedSeconds(fromStructure(nested, 'bike'))).toBe(240)
  })

  it('starts swims in metres and other sports in minutes', () => {
    const [swim] = starterBlocks('swim')
    const [run] = starterBlocks('run')

    expect(swim).toMatchObject({ measure: 'distance', metric: 'css_pct' })
    expect(run).toMatchObject({ measure: 'time', metric: 'threshold_pace_pct' })
  })

  it('totals the time of timed steps', () => {
    expect(timedSeconds(fromStructure(sweetSpot, 'bike'))).toBe(900 + 3 * 660 + 600)
  })

  it('reports steps that cannot be saved', () => {
    const blocks = starterBlocks('bike')
    const warmup = blocks[0]
    if (warmup.type !== 'repeat') {
      warmup.amount = 0
      warmup.low = 80
      warmup.high = 70
    }

    expect(validateBlocks(blocks)).toHaveLength(2)
    expect(validateBlocks([])).toEqual(['Add at least one step.'])
  })
})
