import { describe, expect, it } from 'vitest'
import { parseThresholds } from './thresholds'

describe('parseThresholds', () => {
  it('converts paces to seconds and skips empty fields', () => {
    expect(
      parseThresholds({ ftp_w: '250', threshold_pace_s_per_km: '4:30', css_s_per_100m: '', lthr: ' ' }),
    ).toEqual({
      values: { ftp_w: 250, threshold_pace_s_per_km: 270 },
      errors: {},
    })
  })

  it('reports entries it cannot read', () => {
    const { errors } = parseThresholds({
      ftp_w: 'lots',
      threshold_pace_s_per_km: '4.30',
      css_s_per_100m: '',
      lthr: '',
    })

    expect(Object.keys(errors)).toEqual(['ftp_w', 'threshold_pace_s_per_km'])
  })
})
