# Staging environment runbook

Predictotronix staging is a disposable, production-like deployment for testing
administration workflows against realistic mid-season data. This runbook covers
initial provisioning, deterministic data creation, manual test-season setup,
day-to-day testing, and validation.

## Understand the two environment controls

The deployment environment and the season type are separate controls:

| Control | Purpose | Staging value |
| --- | --- | --- |
| `NODE_ENV` | Runs the optimized Next.js application | `production` |
| `APP_ENV` | Applies Predictotronix environment safety policy | `staging` |
| `seasons.season_type` | Marks application data as production, test, or demo | `test` or `demo` |

Setting `APP_ENV=staging` does not convert existing season data into test data.
Likewise, creating a test season inside the production deployment does not make
that deployment safe for resets. A safe staging setup requires a separate
Render service, a separate Supabase project, and both controls configured.

## Isolation and safety model

| Concern | Production | Staging |
| --- | --- | --- |
| Render service | `predictotronix` | `predictotronix-staging` |
| Supabase project | Production project | Dedicated staging project |
| `APP_ENV` | `production` | `staging` |
| Season type | `production` | `test` or `demo` |
| API-Football sync | Enabled | Disabled by default |
| Email and SMS | Live | Always dry-run |
| Database resets | Never | Explicit guarded operation |

The reset and simulated-clock actions call `assertSafeStagingTarget()` before
making changes. They require all of the following:

- `APP_ENV=staging` is set explicitly.
- `STAGING_SUPABASE_PROJECT_REF` is present.
- The hostname in `NEXT_PUBLIC_SUPABASE_URL` contains exactly that project ref.

External fixture and result synchronization remains disabled unless
`ALLOW_EXTERNAL_FIXTURE_SYNC=true`. Notifications are always dry-run in staging,
including if a season is accidentally marked as production.

Never reuse production Supabase, Resend, Twilio, API-Football, cron, or database
credentials in staging.

## Prerequisites

- Admin access to a separate Supabase project.
- Admin access to the Render workspace.
- Permission to create a GitHub Actions environment and its secrets.
- The staging changes committed to the branch Render will deploy.
- A staging hostname, normally the Render `onrender.com` URL.

The repository provides:

- `render.yaml` for the protected Render staging service.
- `.env.staging.example` as the complete variable inventory.
- `.github/workflows/staging-operations.yml` for migrations, reset, and smoke
  checks.
- `npm run staging:reset` for deterministic data.
- `npm run staging:smoke` for deployment safety assertions.

## 1. Create and configure Supabase staging

1. Create a new Supabase project that will contain staging data only.
2. Copy its project ref from the project URL. For
   `https://abc123.supabase.co`, the project ref is `abc123`.
3. Record the project URL, anon key, service-role key, and database Session
   pooler connection string.
4. URL-encode special characters in the database password inside the connection
   string before storing it as `STAGING_DATABASE_URL`.
5. In **Authentication → URL Configuration**, set **Site URL** to the exact
   deployed staging URL, for example:

   ```text
   https://predictotronix-staging.onrender.com
   ```
6. Add the exact email-confirmation callback to **Redirect URLs**, for example:

   ```text
   https://predictotronix-staging.onrender.com/auth/confirm
   ```

The invite signup flow uses that callback to preserve the league invitation
through email confirmation. It does not require a wildcard callback URL. If an
OAuth or password-reset callback is added later, add its exact staging URL to
Supabase's redirect allow-list. Prefer exact paths over broad wildcards for
this persistent environment. See the
[Supabase redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls).

Do not make schema changes directly in the remote Table Editor or SQL Editor.
Apply committed migrations through the workflow so Supabase migration history
remains consistent.

## 2. Create the protected GitHub environment

In the repository settings, create an Actions environment named exactly
`staging`. Add required reviewers if the repository plan supports them, prevent
self-review where appropriate, and restrict deployment branches to the intended
staging source branch.

Add these environment **secrets**:

| Secret | Value |
| --- | --- |
| `STAGING_SUPABASE_PROJECT_REF` | Dedicated staging project ref |
| `STAGING_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `STAGING_SUPABASE_ANON_KEY` | Staging anon key |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Staging service-role key |
| `STAGING_DATABASE_URL` | URL-encoded Session pooler connection string |
| `STAGING_APP_URL` | Deployed Render staging URL |
| `STAGING_CRON_SECRET` | New staging-only cron secret |

Optionally add `STAGING_EMAIL_DOMAIN` as an environment **variable**, not a
secret. It defaults to `staging.predictotronix.test`.

The workflow is manual and serialized. GitHub does not expose environment
secrets to its job until the environment's protection rules pass. See the
[GitHub environments documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
for plan-specific protection availability.

## 3. Create the Render staging service

Create a new Render Blueprint from `render.yaml`. It creates:

- Project: `predictotronix`.
- Protected environment: `Staging`.
- Web service: `predictotronix-staging`.
- Health check: `/api/health`.
- Build: `npm ci && npm run build`.
- Start: `npm start`.

Render supplies these safe non-secret values from the Blueprint:

```text
NODE_ENV=production
APP_ENV=staging
ALLOW_EXTERNAL_FIXTURE_SYNC=false
STAGING_EMAIL_DOMAIN=staging.predictotronix.test
```

During initial Blueprint creation, enter the staging values requested for every
variable marked `sync: false`:

| Render variable | Source |
| --- | --- |
| `STAGING_SUPABASE_PROJECT_REF` | Supabase staging project ref |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase staging project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase staging service-role key |
| `NEXT_PUBLIC_APP_URL` | Render staging URL |
| `CRON_SECRET` | Same value as GitHub's `STAGING_CRON_SECRET` |

`STAGING_DATABASE_URL` belongs only in the protected GitHub environment; the
web service does not need direct database credentials.

Render prompts for `sync: false` values only during initial Blueprint creation.
If a new secret is added to `render.yaml` later, enter it manually in the
existing service. See the
[Render Blueprint reference](https://render.com/docs/blueprint-spec).

Deploy once so the staging URL and `/api/health` are reachable. Before the
database migrations run, database-backed pages may fail; the health endpoint is
the initial deployment check.

## 4. Apply migrations and create realistic data

Open **Actions → Staging Operations → Run workflow** and select
`migrate-and-reset`.

The workflow will:

1. Validate the protected staging secrets.
2. Run `supabase db push` against `STAGING_DATABASE_URL`.
3. Run the guarded deterministic reset.
4. Smoke-test the deployed service.

Migrations are applied in numeric order, including
`007_season_clock.sql`. The reset is idempotent: rerunning it replaces only the
deterministic staging scenario while preserving and refreshing its five Auth
accounts.

The reset automatically creates an active season named **Staging Mid-Season**
with `season_type=test`. No manual season creation is required for the standard
scenario.

The generated scenario contains:

- 38 gameweeks: 19 completed, one in progress, and 18 upcoming.
- Ten fixtures per normal gameweek, including postponed and rescheduled cases.
- 30 participants with deterministic prediction quality and completeness.
- Leaderboard ties, missing predictions, notification preferences, audit
  records, and dry-run notification history.
- Completed fixtures scored through the real `score_predictions` RPC.

The workflow log prints the current persona credentials after a successful
reset. With the default email domain, the accounts are:

| Persona | Email | Expected access/state |
| --- | --- | --- |
| Sam Super Admin | `superadmin@staging.predictotronix.test` | All administration tools |
| Alex League Admin | `leagueadmin@staging.predictotronix.test` | League administration |
| Priya Player | `player@staging.predictotronix.test` | Approved participant |
| Penny Pending | `pending@staging.predictotronix.test` | Pending join request |
| Oscar Outsider | `outsider@staging.predictotronix.test` | No league membership |

Use the password printed by the most recent reset run; the reset refreshes it on
all five accounts.

## 5. Create a test season manually

Use this only when testing a scenario in addition to the deterministic reset:

1. Sign in as the staging super-admin.
2. Open **Admin → Seasons**.
3. Select the intended league.
4. Under **Create New Season**, enter a name.
5. Choose **Test** or **Demo** from **Season type**.
6. Create the season. It starts in `setup` state.
7. Select **Activate** on the new season.
8. Add participants as required.
9. Open **Admin → Test Season Tools** to manipulate it.

The UI does not convert an existing season between production, test, and demo
types. If a season was created with the wrong type, archive it and create a new
one. Do not alter the remote database manually to bypass this workflow.

## 6. Test different points in the season

Open **Admin → Test Season Tools** as the staging super-admin and select the
active test/demo season.

The **Simulated season clock** can place a selected gameweek:

- 24 hours before its first kickoff: all predictions remain editable.
- One hour after its first kickoff: early fixtures are locked while later
  fixtures can remain open.
- Three hours after its last kickoff: the whole gameweek is locked.

The same season time is used by participant pages, prediction server actions,
PostgreSQL RLS, the kickoff-lock RPC, and reminder scheduling. Production
seasons always use real time, even if a runtime-settings row exists.

Use **Return to real time** when the clock scenario is complete. The page also
supports:

- Injecting and scoring an individual fixture result.
- Marking a fixture as postponed.
- Fast-forwarding the next incomplete gameweek and recalculating scores.

All these actions verify that the selected season is test/demo data.
Notifications remain dry-run throughout staging testing.

## 7. Acceptance checklist

After `migrate-and-reset`, verify all of the following:

- [ ] `GET /api/health` returns `ok: true` and `environment: staging`.
- [ ] The staging smoke workflow passes.
- [ ] Fixture synchronization returns HTTP 409 while external sync is disabled.
- [ ] Each of the five personas can sign in and sees the expected access/state.
- [ ] The super-admin can open Test Season Tools.
- [ ] Moving the clock before kickoff permits prediction creation and editing.
- [ ] Moving it into a gameweek locks early fixtures but leaves later ones open.
- [ ] Moving it after the gameweek locks all fixtures.
- [ ] Result injection updates scores and leaderboard positions.
- [ ] Postponement and fast-forward controls affect only the selected test season.
- [ ] Reminder attempts create dry-run notification-log entries and send nothing.
- [ ] A second `reset` run succeeds and recreates the same scenario cleanly.

Point browser tests at staging by setting `PLAYWRIGHT_BASE_URL` to the Render
staging URL.

## Routine operations

Run the **Staging Operations** workflow with one of these operations:

| Operation | Use |
| --- | --- |
| `smoke` | Verify health and staging provider restrictions |
| `migrate` | Apply unapplied migrations only |
| `reset` | Recreate the deterministic mid-season scenario |
| `migrate-and-reset` | Apply migrations, reset data, then smoke-test |

Use `migrate-and-reset` after schema changes. Use `reset` whenever the test data
needs returning to its deterministic baseline.

For an authorized local run, configure the same staging-only environment
variables in the current shell and run:

```bash
npm run staging:reset
npm run staging:smoke
```

Both commands refuse to proceed when the staging project identity guard does
not match.

## Troubleshooting

- **Reset refuses `APP_ENV`:** set `APP_ENV=staging` explicitly; `NODE_ENV` does
  not substitute for it.
- **Project-ref mismatch:** ensure `STAGING_SUPABASE_PROJECT_REF` exactly matches
  the subdomain in `NEXT_PUBLIC_SUPABASE_URL`.
- **`db push` reports migration-history drift:** stop and inspect with
  `supabase migration list`; do not repair or modify the remote schema without
  understanding the mismatch.
- **Clock controls are disabled:** confirm the Render service has
  `APP_ENV=staging`, the project-ref guard matches, and the user is a super-admin.
- **Auth returns to localhost:** set Supabase Auth's Site URL to the exact Render
  staging URL.
- **A new `sync: false` variable is missing:** add it manually to the existing
  Render service because Blueprint updates do not prompt again.
