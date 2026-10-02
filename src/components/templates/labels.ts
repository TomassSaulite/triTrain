import type { PhaseType, RaceDistance, StepType, TargetMetric, WorkoutKind } from '@/api/types'

export const KINDS: { value: WorkoutKind; label: string }[] = [
  { value: 'endurance', label: 'Endurance' },
  { value: 'long', label: 'Long' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'vo2', label: 'VO2max' },
  { value: 'race_pace', label: 'Race pace' },
  { value: 'technique', label: 'Technique' },
  { value: 'recovery', label: 'Recovery' },
]

export const PHASES: { value: PhaseType; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'build', label: 'Build' },
  { value: 'peak', label: 'Peak' },
  { value: 'taper', label: 'Taper' },
]

export const DISTANCES: { value: RaceDistance; label: string }[] = [
  { value: 'sprint', label: 'Sprint' },
  { value: 'olympic', label: 'Olympic' },
  { value: 'half', label: 'Half' },
  { value: 'full', label: 'Full' },
]

export const STEP_TYPES: { value: Exclude<StepType, 'repeat'>; label: string }[] = [
  { value: 'warmup', label: 'Warm-up' },
  { value: 'steady', label: 'Steady' },
  { value: 'interval', label: 'Interval' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'rest', label: 'Rest' },
  { value: 'cooldown', label: 'Cool-down' },
]

export const METRICS: { value: TargetMetric; label: string }[] = [
  { value: 'ftp_pct', label: '% FTP' },
  { value: 'threshold_pace_pct', label: '% threshold pace' },
  { value: 'css_pct', label: '% CSS' },
  { value: 'lthr_pct', label: '% LTHR' },
]

export const kindLabel = (kind: WorkoutKind) => KINDS.find((k) => k.value === kind)?.label ?? kind
