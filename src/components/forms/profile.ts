import type { AthleteInput, CoachPreferences, Discipline, Experience, Weekday } from '@/api/types'

export interface ProfileDraft {
  timezone: string
  experience: Experience
  weekly_hours: number
  birth_year: number | null
  weight_kg: number | null
  max_hr: number | null
  weakest_sport: Discipline | null
}

export interface ScheduleDraft {
  long_ride_day: Weekday
  long_run_day: Weekday | null
  pool_days: Weekday[]
  rest_days: Weekday[]
  bricks: boolean
}

export function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function defaultProfile(): ProfileDraft {
  return {
    timezone: browserTimezone(),
    experience: 'intermediate',
    weekly_hours: 8,
    birth_year: null,
    weight_kg: null,
    max_hr: null,
    weakest_sport: null,
  }
}

export function defaultSchedule(): ScheduleDraft {
  return { long_ride_day: 6, long_run_day: null, pool_days: [2, 3, 5], rest_days: [1], bricks: true }
}

export function scheduleFrom(prefs: CoachPreferences): ScheduleDraft {
  return {
    long_ride_day: prefs.long_ride_day,
    long_run_day: prefs.long_run_day,
    pool_days: [...prefs.pool_days],
    rest_days: [...prefs.rest_days],
    bricks: prefs.bricks,
  }
}

/** Empty inputs come back from number fields as '' and must be sent as null. */
const orNull = (value: number | string | null): number | null =>
  value === '' || value === null ? null : Number(value)

export function toAthleteInput(profile: ProfileDraft, schedule?: ScheduleDraft): AthleteInput {
  return {
    ...profile,
    weekly_hours: Number(profile.weekly_hours),
    birth_year: orNull(profile.birth_year),
    weight_kg: orNull(profile.weight_kg),
    max_hr: orNull(profile.max_hr),
    ...(schedule ? { preferences: { ...schedule } } : {}),
  }
}
