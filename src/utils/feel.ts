import type { FeelDimension, SessionFeedback } from '@/api/types'

/** The parts of a session the athlete rates, each 1 (best) to 5 (worst). Mirrors the API. */
export const FEEL_SCALES: { key: FeelDimension; label: string; question: string; levels: string[] }[] = [
  {
    key: 'muscles',
    label: 'Muscles',
    question: 'How did your legs and muscles feel?',
    levels: ['Fresh', 'Fine', 'Tired', 'Heavy', 'Sore'],
  },
  {
    key: 'breathing',
    label: 'Breathing',
    question: 'How hard was your breathing?',
    levels: ['Easy', 'Steady', 'Working', 'Hard', 'Gasping'],
  },
  {
    key: 'energy',
    label: 'Energy',
    question: 'How much energy did you have?',
    levels: ['Great', 'Good', 'OK', 'Low', 'Empty'],
  },
  {
    key: 'mood',
    label: 'Mood',
    question: 'How did you enjoy it?',
    levels: ['Loved it', 'Good', 'Neutral', 'A struggle', 'Hated it'],
  },
]

/** The usual words for each step of the 1-10 effort scale. */
export const RPE_LEVELS = [
  'Very easy',
  'Easy',
  'Moderate',
  'Somewhat hard',
  'Hard',
  'Hard',
  'Very hard',
  'Very hard',
  'Extremely hard',
  'Maximal',
]

export function rpeLabel(rpe: number): string {
  return RPE_LEVELS[Math.min(10, Math.max(1, Math.round(rpe))) - 1]
}

/** The word for a rating on a scale, e.g. 4 on muscles is "Heavy". */
export function levelLabel(key: FeelDimension, rating: number): string {
  const scale = FEEL_SCALES.find((s) => s.key === key)!

  return scale.levels[Math.min(5, Math.max(1, Math.round(rating))) - 1]
}

/** A one-line summary of a rating: "Effort 7 · legs heavy · pain (knee)". */
export function feelSummary(f: SessionFeedback): string {
  const parts = [`Effort ${f.rpe}`]
  if (f.muscles !== null) parts.push(`legs ${levelLabel('muscles', f.muscles).toLowerCase()}`)
  if (f.energy !== null) parts.push(`energy ${levelLabel('energy', f.energy).toLowerCase()}`)
  if (f.pain) parts.push(f.pain_area ? `pain (${f.pain_area})` : 'pain')

  return parts.join(' · ')
}
