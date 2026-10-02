import type { Discipline, Step, StepType, StructureBlock, TargetMetric, WorkoutStructure } from '@/api/types'

/**
 * The step editor's working model. Durations are typed in minutes and
 * distances in metres; targets in percent. One level of repeats, which is
 * what a watch can follow comfortably.
 */
export interface EditorStep {
  key: number
  type: Exclude<StepType, 'repeat'>
  measure: 'time' | 'distance'
  amount: number
  metric: TargetMetric
  low: number
  high: number
}

export interface EditorRepeat {
  key: number
  type: 'repeat'
  count: number
  steps: EditorStep[]
}

export type EditorBlock = EditorStep | EditorRepeat

let nextKey = 1
const key = () => nextKey++

export const DEFAULT_METRIC: Record<Discipline, TargetMetric> = {
  swim: 'css_pct',
  bike: 'ftp_pct',
  run: 'threshold_pace_pct',
}

/** Typical easy-to-hard bands per step type, as a starting point. */
const DEFAULT_BANDS: Record<EditorStep['type'], [number, number]> = {
  warmup: [55, 65],
  steady: [65, 75],
  interval: [88, 95],
  recovery: [50, 60],
  rest: [0, 0],
  cooldown: [50, 60],
}

export function newStep(sport: Discipline, type: EditorStep['type'] = 'steady'): EditorStep {
  const [low, high] = DEFAULT_BANDS[type]

  return {
    key: key(),
    type,
    measure: sport === 'swim' ? 'distance' : 'time',
    amount: sport === 'swim' ? 200 : type === 'interval' ? 5 : 10,
    metric: DEFAULT_METRIC[sport],
    low,
    high,
  }
}

export function newRepeat(sport: Discipline): EditorRepeat {
  return {
    key: key(),
    type: 'repeat',
    count: 4,
    steps: [newStep(sport, 'interval'), newStep(sport, 'recovery')],
  }
}

/** A sensible empty workout: warm up, a main set, cool down. */
export function starterBlocks(sport: Discipline): EditorBlock[] {
  return [newStep(sport, 'warmup'), newRepeat(sport), newStep(sport, 'cooldown')]
}

const round = (n: number, places = 3) => Math.round(n * 10 ** places) / 10 ** places

function stepToApi(step: EditorStep): Step {
  const measure =
    step.measure === 'time'
      ? { duration_s: Math.round(step.amount * 60) }
      : { distance_m: Math.round(step.amount) }

  if (step.type === 'rest') {
    return { type: 'rest', ...measure }
  }

  return {
    type: step.type,
    ...measure,
    target: { metric: step.metric, low: round(step.low / 100), high: round(step.high / 100) },
  }
}

export function toStructure(blocks: EditorBlock[]): WorkoutStructure {
  return {
    steps: blocks.map((b) =>
      b.type === 'repeat' ? { type: 'repeat', count: b.count, steps: b.steps.map(stepToApi) } : stepToApi(b),
    ),
  }
}

function stepFromApi(step: Step, sport: Discipline): EditorStep {
  return {
    key: key(),
    type: step.type,
    measure: step.distance_m !== undefined ? 'distance' : 'time',
    amount: step.distance_m ?? round((step.duration_s ?? 0) / 60, 2),
    metric: step.target?.metric ?? DEFAULT_METRIC[sport],
    low: round((step.target?.low ?? 0) * 100, 1),
    high: round((step.target?.high ?? 0) * 100, 1),
  }
}

/** Repeats nested deeper than one level are expanded, which keeps the workout identical. */
function flattenSteps(blocks: StructureBlock[]): Step[] {
  return blocks.flatMap((b) =>
    b.type === 'repeat' ? Array.from({ length: b.count }, () => flattenSteps(b.steps)).flat() : [b],
  )
}

export function fromStructure(structure: WorkoutStructure, sport: Discipline): EditorBlock[] {
  return structure.steps.map((block) =>
    block.type === 'repeat'
      ? {
          key: key(),
          type: 'repeat',
          count: block.count,
          steps: flattenSteps(block.steps).map((s) => stepFromApi(s, sport)),
        }
      : stepFromApi(block, sport),
  )
}

/** Problems worth catching before the API does, keyed by block position. */
export function validateBlocks(blocks: EditorBlock[]): string[] {
  const problems: string[] = []
  const check = (step: EditorStep, where: string) => {
    if (!(step.amount > 0)) problems.push(`${where}: enter a length greater than zero.`)
    if (step.type !== 'rest' && !(step.low > 0 && step.high >= step.low && step.high <= 200)) {
      problems.push(`${where}: the target range must run from a lower to a higher percentage (up to 200%).`)
    }
  }

  if (blocks.length === 0) problems.push('Add at least one step.')

  blocks.forEach((block, i) => {
    if (block.type === 'repeat') {
      if (!(block.count >= 1 && block.count <= 50)) problems.push(`Block ${i + 1}: repeat 1 to 50 times.`)
      if (block.steps.length === 0) problems.push(`Block ${i + 1}: a repeat needs at least one step.`)
      block.steps.forEach((s, j) => check(s, `Block ${i + 1}, step ${j + 1}`))
    } else {
      check(block, `Step ${i + 1}`)
    }
  })

  return problems
}

/** Total time of the timed steps, in seconds. */
export function timedSeconds(blocks: EditorBlock[]): number {
  const seconds = (s: EditorStep) => (s.measure === 'time' ? s.amount * 60 : 0)

  return blocks.reduce(
    (sum, b) =>
      sum + (b.type === 'repeat' ? b.count * b.steps.reduce((t, s) => t + seconds(s), 0) : seconds(b)),
    0,
  )
}
