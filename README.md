# Predictotronix

A Premier League score predictor league app. Players predict fixture scores, the system imports results from API-Football, scores predictions automatically, and maintains season/gameweek leaderboards.

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase (Auth + Postgres + RLS) · Tailwind CSS v4 · shadcn/ui · Playwright · Render

---

## Local Development Setup

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)

### 2. Clone and install

```bash
git clone <repo-url>
cd predictotronix
npm install
```

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API → service_role key |
| `RAPIDAPI_KEY` | [RapidAPI](https://rapidapi.com) → API-Football subscription |
| `RESEND_API_KEY` | [Resend](https://resend.com) → API Keys |
| `TWILIO_ACCOUNT_SID` | [Twilio console](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | Twilio console |
| `TWILIO_FROM_NUMBER` | Your Twilio phone number in E.164 format |
| `CRON_SECRET` | Any strong random string (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

### 4. Run database migrations

In the [Supabase SQL editor](https://supabase.com/dashboard/project/_/sql), run each file **in order**:

1. `supabase/migrations/001_core_schema.sql`
2. `supabase/migrations/002_fixtures_gameweeks.sql`
3. `supabase/migrations/003_predictions_audit.sql`
4. `supabase/migrations/004_notifications.sql`
5. `supabase/migrations/005_rls_policies.sql`
6. `supabase/migrations/006_rpc_functions.sql`

Optionally run `supabase/seed.sql` for a mini test season with sample data.

### 5. Add the Ceefax font

Copy the BBC-Ceefax font file into:

```
public/fonts/bbc-ceefax-logo.otf.woff2
```

### 6. Grant yourself super admin

After registering, run in the Supabase SQL editor (replace with your user ID from `auth.users`):

```sql
insert into public.league_roles (user_id, league_id, role)
values ('<your-user-id>', null, 'super_admin');
```

### 7. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` — redirects to `/login`.

### Local Docker-backed development loop

On Windows and macOS, Next.js recommends running `next dev` natively because Docker Desktop bind mounts can make HMR extremely slow and can cause Turbopack worker timeouts. The local development command therefore runs Next.js natively while keeping Postgres, Auth, and the Supabase API in Docker.

```bash
npm run local:dev
```

The first run downloads the Supabase images and applies the repository migrations and seed. It writes generated local credentials to the ignored `.env.local`, then starts Next.js with Turbopack and fast native filesystem access. The app remains available at the standard Playwright/browser target, `http://localhost:3000`.

```bash
npm run test:e2e
npm run local:stop
```

Stop `local:dev` with Ctrl+C. `npm run local:stop` stops the Docker-backed Supabase services when they are no longer needed.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Run ESLint |

---

## Deployment (Render)

### Web Service

1. Connect your GitHub repo in Render
2. **Build command:** `npm run build`
3. **Start command:** `npm start`
4. Set all environment variables from `.env.local` (use production Supabase values)
5. Uses `output: 'standalone'` for efficient Docker deployment

### Cron Jobs

Three cron jobs required, each sending `x-cron-secret: <CRON_SECRET>` header:

| Endpoint | Schedule | Purpose |
|---|---|---|
| `POST /api/cron/sync-fixtures` | Daily 06:00 UTC | Import fixtures from API-Football |
| `POST /api/cron/sync-results` | Every 15 min | Import results + auto-score predictions |
| `POST /api/cron/send-reminders` | Every 30 min | Send gameweek reminder emails/SMS |

Set these up via **Render Cron Jobs** or GitHub Actions. Example GitHub Actions workflow:

```yaml
# .github/workflows/cron-sync-fixtures.yml
on:
  schedule:
    - cron: '0 6 * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/sync-fixtures \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

---

## Architecture

```
src/
+-- app/
|   +-- (auth)/          # Login, register, join invite
|   +-- (participant)/   # Ceefax-themed participant pages
|   +-- (admin)/         # Professional admin UI
|   +-- api/
|       +-- cron/        # Secured scheduled endpoints
|       +-- admin/       # Admin-only API routes
+-- lib/
|   +-- supabase/        # Browser/server/service-role clients
|   +-- auth/            # RBAC helpers and server actions
|   +-- api-football/    # API-Football client + test provider
|   +-- notifications/   # Resend email + Twilio SMS
|   +-- predictions/     # Prediction server actions
|   +-- scoring/         # Pure scoring functions
|   +-- sync/            # Fixture/result sync logic
+-- types/               # Database types + shared enums
+-- styles/              # Ceefax CSS theme
supabase/
+-- migrations/          # SQL migration files (apply in order)
+-- seed.sql             # Development test data
tests/
+-- unit/                # Vitest unit tests (scoring, leaderboard logic)
+-- e2e/                 # Playwright E2E tests
```

### Key design decisions

| Concern | Approach |
|---|---|
| Prediction visibility | RLS: participants can only SELECT their own. Admins use service-role client. |
| Kickoff locking | Server Action check **and** RLS UPDATE policy (defence in depth) |
| Offline participants | `participants` table independent of `auth.users` — offline entries have `user_id = null` |
| Test data isolation | `season_type` column — test/demo seasons never contaminate production |
| Fixture provider | `FixtureProvider` interface — swap `ApiFootballProvider` for `TestFixtureProvider` per season |
| Notifications in test mode | Test seasons always dry-run (logged, not sent) |
| Scoring | Database RPC `score_predictions(fixture_id)` — atomic, idempotent |
| Leaderboards | Database RPC — returns points only, never raw predictions |

---

## Pre-Season Testing

Use **Test Season Tools** in the admin UI (`/admin/test-tools`) to:

- Inject results for fixtures without waiting for real matches
- Mark fixtures as postponed
- Fast-forward an entire gameweek with randomised results

Test seasons are fully isolated — notifications are dry-run only.
