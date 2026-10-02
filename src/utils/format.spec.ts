import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, nextSunday, startOfWeek, weekday } from './dates'
import {
  formatClock,
  formatDistance,
  formatDuration,
  formatPacing,
  formatRaceTime,
  formatRelativeTarget,
  formatResolvedTarget,
  formatThreshold,
  parseClock,
} from './format'

describe('format', () => {
  it('formats durations in minutes, then hours', () => {
    expect(formatDuration(2700)).toBe('45 min')
    expect(formatDuration(3900)).toBe('1 h 05')
  })

  it('round-trips clock values', () => {
    expect(formatClock(245)).toBe('4:05')
    expect(parseClock('4:05')).toBe(245)
    expect(parseClock('105')).toBe(105)
    expect(parseClock('4:75')).toBeNull()
    expect(parseClock('fast')).toBeNull()
  })

  it('formats distances', () => {
    expect(formatDistance(400)).toBe('400 m')
    expect(formatDistance(10000)).toBe('10 km')
    expect(formatDistance(1500)).toBe('1.5 km')
  })

  it('formats targets', () => {
    expect(formatRelativeTarget({ metric: 'ftp_pct', low: 0.88, high: 0.93 })).toBe('88–93% FTP')
    expect(formatResolvedTarget({ unit: 'watts', low: 220, high: 232.4 })).toBe('220–232 W')
    expect(formatResolvedTarget({ unit: 's_per_km', low: 300, high: 270 })).toBe('5:00–4:30 /km')
  })

  it('formats thresholds by metric', () => {
    expect(formatThreshold('ftp_w', 250)).toBe('250 W')
    expect(formatThreshold('css_s_per_100m', 105)).toBe('1:45 /100m')
  })
})

describe('dates', () => {
  it('works on calendar dates across month ends', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3)
  })

  it('uses ISO weekdays with Monday-start weeks', () => {
    expect(weekday('2026-10-04')).toBe(7)
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28')
    expect(startOfWeek('2026-10-05')).toBe('2026-10-05')
  })
  it('finds the next Sunday for default race dates', () => {
    expect(nextSunday('2026-10-02')).toBe('2026-10-04')
    expect(nextSunday('2026-10-04')).toBe('2026-10-04')
  })
})

describe('race formatting', () => {
  it('formats race times and pacing values', () => {
    expect(formatRaceTime(18898)).toBe('5:14:58')
    expect(formatRaceTime(3605)).toBe('1:00:05')
    expect(formatRaceTime(1500)).toBe('25:00')
    expect(formatPacing('watts', 189.4)).toBe('189 W')
    expect(formatPacing('s_per_km', 309)).toBe('5:09 /km')
    expect(formatPacing('s_per_100m', 111)).toBe('1:51 /100m')
  })
})
