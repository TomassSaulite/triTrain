import type { PhaseType, Sport, WeekProgress, WorkoutKind } from '@/api/types'

/** Why a session of each kind is in the plan, in the coach's words. */
const KIND_PURPOSE: Record<WorkoutKind, string> = {
  endurance: 'Builds your aerobic engine. Keep it conversational.',
  long: 'Builds the endurance to go the distance. Steady, and fuel as you would on race day.',
  tempo: 'Raises the pace you can hold for hours. Comfortably hard, never all-out.',
  threshold: 'Lifts your threshold, the effort you can sustain for about an hour.',
  vo2: 'Short, hard efforts that raise your ceiling. Full recovery between them.',
  race_pace: 'Practises race effort so race day feels familiar.',
  recovery: 'Helps you absorb the hard work. Easier than you think it should be.',
  technique: 'Makes you faster for the same effort through better form.',
}

/** Where a sport needs its own words: you cannot eat in the pool, and bricks are about the switch. */
const SPORT_PURPOSE: Partial<Record<Sport, Partial<Record<WorkoutKind, string>>>> = {
  swim: {
    long: 'Builds the endurance to swim the whole distance strongly. Hold good form to the end.',
  },
  brick: {
    endurance:
      'Teaches your legs to run straight off the bike. Keep the first minutes of the run controlled.',
    long: 'Teaches your legs to run straight off the bike. Keep the first minutes of the run controlled.',
  },
}

/** Why a session is in the plan, in the coach's words. */
export function sessionPurpose(sport: Sport, kind: WorkoutKind): string {
  return SPORT_PURPOSE[sport]?.[kind] ?? KIND_PURPOSE[kind]
}

const PHASE_FOCUS: Record<PhaseType, string> = {
  base: 'building aerobic fitness with mostly easy volume',
  build: 'adding threshold work on top of your base',
  peak: 'race-specific sessions at the highest load of the plan',
  taper: 'cutting volume so you arrive fresh, keeping a little intensity',
}

export interface WeekFocus {
  phase: PhaseType
  /** 1-based position of this week within its phase. */
  week: number
  weeksInPhase: number
  isRecovery: boolean
  message: string
}

/** Where a week sits in the plan and what the coach wants from it. */
export function weekFocus(weeks: WeekProgress[], monday: string): WeekFocus | null {
  const index = weeks.findIndex((w) => w.start_date === monday)
  if (index === -1) return null

  const current = weeks[index]
  const samePhase = weeks.filter((w) => w.phase === current.phase)
  const week = samePhase.findIndex((w) => w.start_date === monday) + 1

  const message = current.is_recovery
    ? 'Recovery week: less volume so your body absorbs the last block. Keep it easy.'
    : `This week is about ${PHASE_FOCUS[current.phase]}.`

  return {
    phase: current.phase,
    week,
    weeksInPhase: samePhase.length,
    isRecovery: current.is_recovery,
    message,
  }
}
