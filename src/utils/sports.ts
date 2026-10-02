import type { Sport, WorkoutStatus } from '@/api/types'

export const SPORTS: Record<Sport, { label: string; dot: string; soft: string }> = {
  swim: { label: 'Swim', dot: 'bg-swim', soft: 'bg-swim/10 text-swim' },
  bike: { label: 'Bike', dot: 'bg-bike', soft: 'bg-bike/10 text-bike' },
  run: { label: 'Run', dot: 'bg-run', soft: 'bg-run/10 text-run' },
  brick: { label: 'Brick', dot: 'bg-brick', soft: 'bg-brick/10 text-brick' },
  strength: { label: 'Strength', dot: 'bg-strength', soft: 'bg-strength/10 text-strength' },
}

export const STATUSES: Record<WorkoutStatus, { label: string; classes: string }> = {
  planned: { label: 'Planned', classes: 'bg-slate-100 text-slate-700' },
  moved: { label: 'Moved', classes: 'bg-sky-100 text-sky-800' },
  completed: { label: 'Done', classes: 'bg-emerald-100 text-emerald-800' },
  partial: { label: 'Partial', classes: 'bg-amber-100 text-amber-800' },
  missed: { label: 'Missed', classes: 'bg-rose-100 text-rose-800' },
  dropped: { label: 'Skipped', classes: 'bg-slate-100 text-slate-500 line-through' },
}

export function isOpenStatus(status: WorkoutStatus): boolean {
  return status === 'planned' || status === 'moved'
}
