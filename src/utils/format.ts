import type { ResolvedTarget, Target, ThresholdMetric } from '@/api/types'

/** "45 min", "1 h 05". */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)

  if (minutes < 60) {
    return `${minutes} min`
  }

  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}

/** "4:05" for 245 seconds. */
export function formatClock(seconds: number): string {
  const rounded = Math.round(seconds)

  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`
}

/** Parses "4:05" (or plain seconds) back into seconds; null when it is not a time. */
export function parseClock(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)$/)

  if (match) {
    return Number(match[1]) * 60 + Number(match[2])
  }

  return /^\d+$/.test(value.trim()) ? Number(value.trim()) : null
}

export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)} km` : `${meters} m`
}

export function formatTss(tss: number | null | undefined): string {
  return tss === null || tss === undefined ? '–' : String(Math.round(tss))
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

/** An absolute target band, easy end first: "186–208 W", "5:00–4:30 /km". */
export function formatResolvedTarget(target: ResolvedTarget): string {
  switch (target.unit) {
    case 'watts':
      return `${Math.round(target.low)}–${Math.round(target.high)} W`
    case 'bpm':
      return `${Math.round(target.low)}–${Math.round(target.high)} bpm`
    case 's_per_km':
      return `${formatClock(target.low)}–${formatClock(target.high)} /km`
    case 's_per_100m':
      return `${formatClock(target.low)}–${formatClock(target.high)} /100m`
  }
}

const TARGET_LABELS: Record<Target['metric'], string> = {
  ftp_pct: 'FTP',
  threshold_pace_pct: 'threshold pace',
  css_pct: 'CSS',
  lthr_pct: 'LTHR',
}

/** A relative target: "88–93% FTP". */
export function formatRelativeTarget(target: Target): string {
  const low = Math.round(target.low * 100)
  const high = Math.round(target.high * 100)

  return `${low === high ? low : `${low}–${high}`}% ${TARGET_LABELS[target.metric]}`
}

export const THRESHOLD_METRICS: Record<ThresholdMetric, { label: string; unit: string; isPace: boolean }> = {
  ftp_w: { label: 'FTP', unit: 'W', isPace: false },
  threshold_pace_s_per_km: { label: 'Threshold run pace', unit: '/km', isPace: true },
  css_s_per_100m: { label: 'Critical swim speed', unit: '/100m', isPace: true },
  lthr: { label: 'Threshold heart rate', unit: 'bpm', isPace: false },
}

export function formatThreshold(metric: ThresholdMetric, value: number): string {
  const { unit, isPace } = THRESHOLD_METRICS[metric]

  return isPace ? `${formatClock(value)} ${unit}` : `${Math.round(value)} ${unit}`
}

export function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}
