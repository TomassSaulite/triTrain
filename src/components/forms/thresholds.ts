import type { ThresholdMetric } from '@/api/types'
import { THRESHOLD_METRICS, parseClock } from '@/utils/format'

/** Threshold inputs as typed: paces as m:ss, the rest as plain numbers. */
export interface ThresholdDraft {
  ftp_w: string
  threshold_pace_s_per_km: string
  css_s_per_100m: string
  lthr: string
}

export function emptyThresholds(): ThresholdDraft {
  return { ftp_w: '', threshold_pace_s_per_km: '', css_s_per_100m: '', lthr: '' }
}

/**
 * Turns the filled-in fields into API values (paces typed as m:ss become
 * seconds). Unparseable entries are reported per metric.
 */
export function parseThresholds(draft: ThresholdDraft): {
  values: Partial<Record<ThresholdMetric, number>>
  errors: Record<string, string>
} {
  const values: Partial<Record<ThresholdMetric, number>> = {}
  const errors: Record<string, string> = {}

  for (const metric of Object.keys(draft) as ThresholdMetric[]) {
    const raw = draft[metric].trim()

    if (raw === '') {
      continue
    }

    const value = THRESHOLD_METRICS[metric].isPace ? parseClock(raw) : Number(raw)

    if (value === null || Number.isNaN(value) || value <= 0) {
      errors[metric] = THRESHOLD_METRICS[metric].isPace
        ? 'Use minutes:seconds, e.g. 4:30.'
        : 'Enter a number.'
    } else {
      values[metric] = value
    }
  }

  return { values, errors }
}
