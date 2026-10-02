/**
 * Types mirroring the TriTrain API's resources (see the API's docs/api.md).
 * Dates are `YYYY-MM-DD`, timestamps ISO-8601, durations seconds, distances metres.
 */

export type Sport = 'swim' | 'bike' | 'run' | 'brick' | 'strength'
export type Discipline = 'swim' | 'bike' | 'run'
export type Experience = 'novice' | 'intermediate' | 'advanced'
export type RaceDistance =
  'sprint' | 'olympic' | 'half' | 'full' | '5k' | '10k' | 'half_marathon' | 'marathon'
export type RacePriority = 'A' | 'B' | 'C'
export type PlanStatus = 'active' | 'completed' | 'archived'
export type PhaseType = 'base' | 'build' | 'peak' | 'taper'
export type WorkoutKind =
  'endurance' | 'tempo' | 'threshold' | 'vo2' | 'race_pace' | 'long' | 'recovery' | 'technique'
export type WorkoutStatus = 'planned' | 'moved' | 'completed' | 'partial' | 'missed' | 'dropped'
export type ActivitySource = 'strava' | 'health_connect' | 'fit' | 'manual'
export type ThresholdMetric = 'ftp_w' | 'threshold_pace_s_per_km' | 'css_s_per_100m' | 'lthr'
export type ThresholdSource = 'test' | 'estimated' | 'auto_detected'
export type TssMethod = 'power' | 'pace' | 'heart_rate' | 'estimated' | 'provided'
export type RevisionReason = 'generated' | 'regenerated' | 'adapted' | 'manual'
export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed'
export type TargetMetric = 'ftp_pct' | 'threshold_pace_pct' | 'css_pct' | 'lthr_pct'
export type StepType = 'warmup' | 'steady' | 'interval' | 'recovery' | 'rest' | 'cooldown' | 'repeat'

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface Data<T> {
  data: T
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export interface User {
  id: number
  name: string
  email: string
  athlete?: Athlete | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface CoachPreferences {
  long_ride_day: Weekday
  long_run_day: Weekday | null
  pool_days: Weekday[]
  rest_days: Weekday[]
  day_limits_minutes: Partial<Record<Weekday, number>>
  recovery_week_every: number | null
  max_ramp_rate: number
  target_ctl: number | null
  sport_share: Record<Discipline, number> | null
  bricks: boolean
}

export interface Athlete {
  id: number
  timezone: string
  birth_year: number | null
  weight_kg: number | null
  max_hr: number | null
  experience: Experience
  weekly_hours: number
  weakest_sport: Discipline | null
  preferences: CoachPreferences
  updated_at: string
}

export interface AthleteInput {
  timezone?: string
  birth_year?: number | null
  weight_kg?: number | null
  max_hr?: number | null
  experience?: Experience
  weekly_hours?: number
  weakest_sport?: Discipline | null
  preferences?: Partial<CoachPreferences>
}

export interface Threshold {
  id: number
  sport: Sport | null
  metric: ThresholdMetric
  value: number
  tested_at: string
  source: ThresholdSource
  created_at: string
}

export interface ThresholdSuggestion {
  id: number
  metric: ThresholdMetric
  current_value: number | null
  suggested_value: number
  rationale: string
  status: SuggestionStatus
  activity_id: number | null
  created_at: string
  resolved_at: string | null
}

export interface Race {
  id: number
  name: string
  distance: RaceDistance
  date: string
  priority: RacePriority
  days_to_go: number
}

export interface RaceInput {
  name: string
  distance: RaceDistance
  date: string
  priority?: RacePriority
}

export type BreakReason = 'sick' | 'injured' | 'away' | 'other'

export interface AvailabilityOverride {
  date: string
  available_minutes: number
  note: string | null
  /** Only easy sessions that day, e.g. the first days back after being sick. */
  easy_only: boolean
}

export interface PlanPhase {
  type: PhaseType
  start_date: string
  end_date: string
}

export interface PlannedWorkout {
  id: number
  plan_id: number
  parent_id: number | null
  date: string
  sport: Sport
  kind: WorkoutKind
  is_key: boolean
  title: string
  target_duration_s: number
  target_distance_m: number | null
  target_tss: number
  status: WorkoutStatus
  compliance: number | null
  activity_id: number | null
  template_id: number | null
  children?: PlannedWorkout[]
  activity?: Activity | null
}

export interface Target {
  metric: TargetMetric
  low: number
  high: number
}

export interface ResolvedTarget {
  unit: 'watts' | 'bpm' | 's_per_km' | 's_per_100m'
  low: number
  high: number
}

export interface Step {
  type: Exclude<StepType, 'repeat'>
  duration_s?: number
  distance_m?: number
  target?: Target
  note?: string
  resolved?: ResolvedTarget | null
}

export interface RepeatBlock {
  type: 'repeat'
  count: number
  steps: StructureBlock[]
}

export type StructureBlock = Step | RepeatBlock

export interface WorkoutStructure {
  steps: StructureBlock[]
}

export interface PlannedWorkoutDetail extends PlannedWorkout {
  structure: WorkoutStructure | null
  resolved_structure: WorkoutStructure | null
}

export interface PlanWeek {
  id: number
  week_index: number
  start_date: string
  phase?: PhaseType
  is_recovery: boolean
  target_tss: number
  target_hours: number
  planned_tss?: number
}

export interface Plan {
  id: number
  status: PlanStatus
  version: number
  generator_version: string
  start_date: string
  starting_ctl: number
  target_ctl: number
  warnings: string[]
  race?: Race
  phases?: PlanPhase[]
  weeks?: PlanWeek[]
  created_at: string
  updated_at: string
}

export interface PlanChange {
  type: string
  rule?: string
  key?: string
  reason?: string
  workout_id?: number
  date?: string
  factor?: number
  week_start?: string
  from_tss?: number
  to_tss?: number
  from?: string
  to?: string
}

export interface PlanRevision {
  version: number
  reason: RevisionReason
  summary: string
  changes: PlanChange[]
  created_at: string
}

export interface WeekProgress {
  week_index: number
  start_date: string
  phase: PhaseType
  is_recovery: boolean
  target_tss: number
  planned: { tss: number; duration_s: number; sessions: number }
  actual: { tss: number; duration_s: number; activities: number }
  sessions: { completed: number; partial: number; missed: number; upcoming: number }
  by_sport: Record<Discipline, { planned_duration_s: number; actual_duration_s: number }>
  compliance: number | null
}

export interface RaceLegPlan {
  sport: Sport
  distance_m: number
  /** Null when the athlete has no threshold for this sport. */
  target: {
    unit: 'watts' | 's_per_km' | 's_per_100m'
    easy: number
    hard: number
    target: number
    intensity: number
  } | null
  predicted_s: number | null
  advice: string
}

export interface RaceStrategy {
  legs: RaceLegPlan[]
  transitions_s: number
  /** Null unless every leg could be predicted. */
  finish_s: number | null
  fueling: { before: string[]; during: string[] }
  /** What the athlete could add for a fuller plan. */
  missing: string[]
}

export type ReviewVerdict = 'on_track' | 'keys_missed' | 'under' | 'over' | 'rest'

export interface WeeklyReview {
  week_start: string
  week_end: string
  phase: PhaseType
  is_recovery: boolean
  /** False while the reviewed week is still under way. */
  finished: boolean
  verdict: ReviewVerdict
  headline: string
  notes: string[]
  next_week: string | null
  planned: { tss: number; duration_s: number; sessions: number }
  actual: { tss: number; duration_s: number; activities: number }
  compliance: number | null
  key_sessions: { planned: number; done: number; missed: string[] }
  feel: {
    sessions: number
    rated: number
    rpe: number | null
    muscles: number | null
    breathing: number | null
    energy: number | null
    mood: number | null
    pain_reports: number
  }
  fitness: { ctl_before: number | null; ctl_after: number | null; tsb_after: number | null }
  coach_changes: { version: number; summary: string; created_at: string }[]
}

export interface Activity {
  id: number
  source: ActivitySource
  external_id: string | null
  sport: Sport
  name: string | null
  started_at: string
  duration_s: number
  distance_m: number | null
  avg_hr: number | null
  np_w: number | null
  best_20min_power_w: number | null
  avg_pace: number | null
  tss: number | null
  tss_method: TssMethod | null
  intensity_factor: number | null
  planned_workout_id?: number | null
  feedback?: SessionFeedback | null
}

export type FeelDimension = 'muscles' | 'breathing' | 'energy' | 'mood'

/** How a session felt: RPE 1-10, each dimension 1 (best) to 5 (worst). */
export interface SessionFeedback {
  id: number
  activity_id: number
  rpe: number
  muscles: number | null
  breathing: number | null
  energy: number | null
  mood: number | null
  pain: boolean
  pain_area: string | null
  note: string | null
  updated_at: string
}

export type SessionFeedbackInput = Omit<SessionFeedback, 'id' | 'activity_id' | 'updated_at'>

/** A rating with the session it belongs to, for trends. */
export interface FeedbackEntry extends SessionFeedback {
  date: string
  sport: Sport
  activity_name: string | null
  duration_s: number
  planned_kind: WorkoutKind | null
}

export interface ActivityInput {
  sport: Exclude<Sport, 'brick'>
  name?: string | null
  started_at: string
  duration_s: number
  distance_m?: number | null
  avg_hr?: number | null
  np_w?: number | null
  avg_pace?: number | null
  tss?: number | null
}

export interface DailyLoad {
  date: string
  tss: number
  ctl: number
  atl: number
  tsb: number
}

export interface LoadSummary {
  date: string
  ctl: number
  atl: number
  tsb: number
  ramp_7d: number
  tss_7d: number
  has_history: boolean
}

export interface CalendarDay {
  date: string
  workouts: PlannedWorkout[]
  activities: Activity[]
  races: Race[]
  /** The day's own availability (a day off sick, a short or easy day), if any. */
  availability: AvailabilityOverride | null
}

export interface Calendar {
  data: CalendarDay[]
  meta: { plan_id: number | null; plan_version: number | null; from: string; to: string }
}

export interface StravaStatus {
  connected: boolean
  strava_athlete_id: number | null
  scope: string | null
  connected_at: string | null
}

export interface WorkoutTemplate {
  id: number
  slug: string
  name: string
  description: string | null
  sport: Sport
  kind: WorkoutKind
  phases: PhaseType[]
  distances: RaceDistance[] | null
  min_s: number
  max_s: number
  intensity_factor: number
  structure: WorkoutStructure
  is_system: boolean
  is_active: boolean
}

export interface WorkoutTemplateInput {
  name: string
  description?: string | null
  sport: Discipline
  kind: WorkoutKind
  phases: PhaseType[]
  distances?: RaceDistance[] | null
  min_s: number
  max_s: number
  structure: WorkoutStructure
  is_active?: boolean
}

export interface WorkoutAlternative {
  id: number
  name: string
  kind: WorkoutKind
  min_s: number
  max_s: number
  is_personal: boolean
}
