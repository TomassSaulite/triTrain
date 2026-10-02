/**
 * Calendar-date helpers. The API speaks plain `YYYY-MM-DD` dates in the
 * athlete's timezone, so these work on local dates and never go through UTC.
 */

export function parseDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)

  return new Date(year, month - 1, day)
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function today(): string {
  return toIsoDate(new Date())
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value)
  date.setDate(date.getDate() + days)

  return toIsoDate(date)
}

/** ISO weekday, 1 = Monday ... 7 = Sunday. */
export function weekday(value: string): number {
  return parseDate(value).getDay() || 7
}

export function startOfWeek(value: string): string {
  return addDays(value, 1 - weekday(value))
}

/** The first Sunday on or after a date: a sensible default for a race day. */
export function nextSunday(value: string): string {
  return addDays(value, (7 - weekday(value)) % 7)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000)
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' },
): string {
  return parseDate(value).toLocaleDateString(undefined, options)
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const WEEKDAYS = [
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
  { value: 7, short: 'Sun', long: 'Sunday' },
] as const
