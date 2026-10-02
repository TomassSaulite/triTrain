import type { RaceDistance } from '@/api/types'

export const RACE_DISTANCES: { group: string; options: { value: RaceDistance; label: string }[] }[] = [
  {
    group: 'Triathlon',
    options: [
      { value: 'sprint', label: 'Sprint' },
      { value: 'olympic', label: 'Olympic' },
      { value: 'half', label: 'Half (70.3)' },
      { value: 'full', label: 'Full (Ironman)' },
    ],
  },
  {
    group: 'Running',
    options: [
      { value: '5k', label: '5K' },
      { value: '10k', label: '10K' },
      { value: 'half_marathon', label: 'Half marathon' },
      { value: 'marathon', label: 'Marathon' },
    ],
  },
]

export function isTriathlon(distance: RaceDistance): boolean {
  return ['sprint', 'olympic', 'half', 'full'].includes(distance)
}

export function distanceLabel(distance: RaceDistance): string {
  return RACE_DISTANCES.flatMap((g) => g.options).find((o) => o.value === distance)?.label ?? distance
}
