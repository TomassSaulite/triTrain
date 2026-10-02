# TriTrain

The web app for TriTrain, a triathlon training app that works like a customizable coach. It
talks to the [TriTrain API](https://github.com/TomassSaulite/triTrainAPI), which builds the
plan, scores every session and adapts the remaining weeks as training syncs in.

## What's in it

- **Onboarding**: experience and weekly hours, the athlete's week (long ride and run days,
  pool days, rest days, bricks), thresholds, and the goal race that builds the first plan.
- **Today**: today's sessions, the next six days, race countdown, plan warnings, threshold
  suggestions to accept or dismiss, this week's planned against done load, and fitness,
  fatigue and form over 90 days.
- **Calendar**: a week or four-week view of planned sessions, races and extra activities.
- **Workout detail**: the session's steps with the athlete's real targets (watts, paces, heart
  rate) next to the relative ones, an intensity profile, and moving or skipping a session.
- **Plan**: phases, planned against done load per week, a week-by-week table, re-planning, and
  the "what changed and why" log.
- **Races**: A, B and C races; build a plan from an A race.
- **Activities**: history, manual logging, and how each session was scored.
- **Settings**: profile and week, coaching knobs (ramp limit, recovery cadence, target fitness,
  daily time limits, sport split), thresholds, travel and busy days, and Strava.

## Getting started

Requirements: Node 22+, and the API running (see its README; `php artisan db:seed` in a local
environment creates `demo@tritrain.test` / `password` with history and a plan).

```bash
npm install
cp .env.example .env.local   # VITE_API_URL, default http://localhost:8000/api/v1
npm run dev                  # http://localhost:5173
```

To connect Strava from the web app, set `STRAVA_APP_RETURN_URL` in the API's `.env` to this
app's settings page, e.g. `http://localhost:5173/settings`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm test` | Vitest unit and component tests |
| `npm run lint` / `lint:check` | ESLint (fix / verify) |
| `npm run format` / `format:check` | Prettier (fix / verify) |
| `npm run typecheck` | `vue-tsc` |

CI runs lint, format, typecheck, tests and the build on every push and pull request.

## Code tour

| Path | What lives there |
| --- | --- |
| `src/api` | Typed API client: one function per endpoint, resource types, token storage. |
| `src/stores` | Pinia store for the signed-in athlete. |
| `src/router` | Routes and guards (sign-in, onboarding until a profile exists). |
| `src/views` | One component per page. |
| `src/components` | Shared pieces: workout cards, steps, badges, forms, settings sections. |
| `src/components/charts` | Hand-rolled SVG charts (fitness and form, weekly load, workout profile). |
| `src/composables` | `useAsync` for loading data, `useForm` for submitting with API validation errors. |
| `src/utils` | Date helpers (calendar dates, never through UTC), formatting, sport metadata. |

### Conventions

- Dates from the API are plain `YYYY-MM-DD` days in the athlete's timezone; `utils/dates`
  works on those without converting to UTC.
- Workouts are stored relative to thresholds; pages show the resolved values the API returns
  and fall back to percentages when a threshold is missing.
- Charts never share an axis between different measures. They have legends and direct labels,
  a hover tooltip, a table view, and colours from a colour-blind-safe palette.
