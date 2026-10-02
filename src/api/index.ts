import { ApiClient } from './client'
import { tokenStorage } from './token'
import type {
  Activity,
  ActivityInput,
  Athlete,
  AthleteInput,
  AuthResponse,
  AvailabilityOverride,
  Calendar,
  DailyLoad,
  Data,
  LoadSummary,
  Paginated,
  Plan,
  PlannedWorkoutDetail,
  PlanRevision,
  Race,
  RaceInput,
  StravaStatus,
  Threshold,
  ThresholdMetric,
  ThresholdSuggestion,
  User,
  WeekProgress,
  WorkoutTemplate,
} from './types'

let unauthorizedHandler: () => void = () => {}

/** Called when the API rejects the stored token, e.g. after it was revoked. */
export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler
}

export const client = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  token: () => tokenStorage.get(),
  onUnauthorized: () => unauthorizedHandler(),
})

const DEVICE = 'web'

const unwrap = <T>(promise: Promise<Data<T>>): Promise<T> => promise.then((r) => r.data)

export const auth = {
  register: (input: { name: string; email: string; password: string; password_confirmation: string }) =>
    client.post<AuthResponse>('auth/register', { ...input, device_name: DEVICE }),
  login: (email: string, password: string) =>
    client.post<AuthResponse>('auth/login', { email, password, device_name: DEVICE }),
  logout: () => client.post<void>('auth/logout'),
  me: () => unwrap(client.get<Data<User>>('me')),
}

export const athleteApi = {
  get: () => unwrap(client.get<Data<Athlete>>('athlete')),
  save: (input: AthleteInput) => unwrap(client.put<Data<Athlete>>('athlete', input)),
}

export const thresholdsApi = {
  current: () => unwrap(client.get<Data<Threshold[]>>('thresholds/current')),
  history: (metric?: ThresholdMetric) => client.get<Paginated<Threshold>>('thresholds', { metric }),
  record: (metric: ThresholdMetric, value: number, testedAt?: string) =>
    unwrap(client.post<Data<Threshold>>('thresholds', { metric, value, tested_at: testedAt })),
  remove: (id: number) => client.delete(`thresholds/${id}`),
}

export const suggestionsApi = {
  pending: () => unwrap(client.get<Data<ThresholdSuggestion[]>>('threshold-suggestions')),
  accept: (id: number) => unwrap(client.post<Data<Threshold>>(`threshold-suggestions/${id}/accept`)),
  dismiss: (id: number) =>
    unwrap(client.post<Data<ThresholdSuggestion>>(`threshold-suggestions/${id}/dismiss`)),
}

export const racesApi = {
  list: (upcoming = false) =>
    unwrap(client.get<Data<Race[]>>('races', { upcoming: upcoming ? 1 : undefined })),
  create: (input: RaceInput) => unwrap(client.post<Data<Race>>('races', input)),
  update: (id: number, input: Partial<RaceInput>) => unwrap(client.patch<Data<Race>>(`races/${id}`, input)),
  remove: (id: number) => client.delete(`races/${id}`),
  createPlan: (id: number) => unwrap(client.post<Data<Plan>>(`races/${id}/plan`)),
}

export const availabilityApi = {
  list: (from?: string, to?: string) =>
    unwrap(client.get<Data<AvailabilityOverride[]>>('availability', { from, to })),
  set: (date: string, availableMinutes: number, note?: string) =>
    unwrap(
      client.put<Data<AvailabilityOverride>>(`availability/${date}`, {
        available_minutes: availableMinutes,
        note,
      }),
    ),
  clear: (date: string) => client.delete(`availability/${date}`),
}

export const plansApi = {
  list: () => unwrap(client.get<Data<Plan[]>>('plans')),
  current: () => unwrap(client.get<Data<Plan>>('plans/current')),
  get: (id: number) => unwrap(client.get<Data<Plan>>(`plans/${id}`)),
  regenerate: (id: number, reason?: string) =>
    unwrap(client.post<Data<Plan>>(`plans/${id}/regenerate`, { reason })),
  archive: (id: number) => unwrap(client.post<Data<Plan>>(`plans/${id}/archive`)),
  revisions: (id: number) => client.get<Paginated<PlanRevision>>(`plans/${id}/revisions`),
  progress: (id: number) => unwrap(client.get<Data<WeekProgress[]>>(`plans/${id}/progress`)),
}

export const calendarApi = {
  range: (from: string, to: string) => client.get<Calendar>('calendar', { from, to }),
}

export const workoutsApi = {
  get: (id: number) => unwrap(client.get<Data<PlannedWorkoutDetail>>(`planned-workouts/${id}`)),
  move: (id: number, date: string) =>
    unwrap(client.patch<Data<PlannedWorkoutDetail>>(`planned-workouts/${id}`, { date })),
  skip: (id: number) => unwrap(client.post<Data<PlannedWorkoutDetail>>(`planned-workouts/${id}/skip`)),
}

export const activitiesApi = {
  list: (query: { from?: string; to?: string; sport?: string; page?: number } = {}) =>
    client.get<Paginated<Activity>>('activities', query),
  get: (id: number) => unwrap(client.get<Data<Activity>>(`activities/${id}`)),
  create: (input: ActivityInput) => unwrap(client.post<Data<Activity>>('activities', input)),
  remove: (id: number) => client.delete(`activities/${id}`),
}

export const loadApi = {
  series: (from?: string, to?: string) => unwrap(client.get<Data<DailyLoad[]>>('load', { from, to })),
  summary: () => unwrap(client.get<Data<LoadSummary>>('load/summary')),
}

export const stravaApi = {
  status: () => unwrap(client.get<Data<StravaStatus>>('strava')),
  connectUrl: () => unwrap(client.post<Data<{ url: string }>>('strava/connect')).then((d) => d.url),
  disconnect: () => client.delete('strava'),
}

export const templatesApi = {
  list: (query: { sport?: string; kind?: string; mine?: boolean } = {}) =>
    unwrap(
      client.get<Data<WorkoutTemplate[]>>('workout-templates', {
        ...query,
        mine: query.mine ? 1 : undefined,
      }),
    ),
}

export { ApiError } from './client'
