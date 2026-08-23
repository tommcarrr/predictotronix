# Graph Report - predictotronix  (2026-08-23)

## Corpus Check
- 189 files · ~76,107 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 966 nodes · 1822 edges · 72 communities (61 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- context.ts
- send-reminders/route.ts
- fixtures/page.tsx
- devDependencies
- server.ts
- dependencies
- compilerOptions
- components.json
- Graphify Skill
- Predictotronix
- Predictotronix guide for superadmins
- QuickMatchGame.tsx
- exports/page.tsx
- Verify Before Completion
- app/layout.tsx
- Q: I have some issues with the admin UX, it feels like the screens are doing too much in one place, like the league settings screen having Create new league forms, deleting the leagues, setting admins etc... all in one place, it is just confusing. Could you look through all admin pages and think about a clearer approach? E.g having some tags or separate pages or modals where this makes sense.
- verify.mjs
- architecture.test.ts
- Q: I have just spun up my staging environment and requested to join a league with a user, I can see the join request in my DB table, but it is not showing in the UI.
- icon.tsx
- join/layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- leaderboard/layout.tsx
- predictions/layout.tsx
- PlayerAccessibilityMode.tsx
- Q: Can you make the suggested changes?
- global.setup.ts
- environment.ts
- local-dev.mjs
- Q: Why is my ability to make predictions being blocked? Also can you stop offline users being highlighted as (offline) in leaderboards/exports etc...?
- supabase-server.test.ts
- Q: Why are they locked at all?
- Q: Should I now be able to use the API sync to get the real fixtures for the upcoming season?
- fpl/client.ts
- leaderboard/[gameweekId]/page.tsx
- predictions/[gameweekId]/page.tsx
- leaderboard/page.tsx
- season/route.ts
- Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing.
- participants/page.tsx
- Q: How do I assign a user to a league from the admin panel?
- Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?
- opengraph-image.tsx
- api-football/client.ts
- Q: Can you talk me through the proposed changes to the flow to make this work?
- Predictotronix guide for players
- Predictotronix guide for league admins
- Q: Give me a nice way to copy the invite link to the clipboard.
- FixtureClipboardExport.tsx
- AdminShell.tsx
- predictions/actions.ts
- getAdminContext
- FixtureProvider
- types/index.ts
- ApiFixture
- fixtures/actions.ts
- fixtures.ts
- getEnvironmentPolicy
- createServiceClient
- Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?
- Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results.

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 76 edges
2. `getAdminContext` - 28 edges
3. `createClient()` - 28 edges
4. `getUser` - 27 edges
5. `normalizeInviteCode()` - 25 edges
6. `requireLeagueAdminForSeason()` - 22 edges
7. `isSuperAdmin()` - 19 edges
8. `ApiFixture` - 18 edges
9. `compilerOptions` - 17 edges
10. `FormSubmitButton()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Graphify-First Codebase Navigation` --semantically_similar_to--> `Existing Graph Fast Path`  [INFERRED] [semantically similar]
  AGENTS.md → .codex/skills/graphify/SKILL.md
- `Verify Before Completion` --semantically_similar_to--> `Verify Job`  [INFERRED] [semantically similar]
  AGENTS.md → .github/workflows/ci.yml
- `Render Cron Containers` --semantically_similar_to--> `Scheduled Fixture, Result, and Reminder Jobs`  [INFERRED] [semantically similar]
  SETUP.md → README.md
- `Next.js Breaking Changes Guidance` --conceptually_related_to--> `Predictotronix`  [INFERRED]
  AGENTS.md → README.md
- `Graphify-First Codebase Navigation` --references--> `Graphify Skill`  [EXTRACTED]
  AGENTS.md → .codex/skills/graphify/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Extraction and Query Lifecycle** — codex_skills_graphify_skill_ast_structural_extraction, codex_skills_graphify_skill_semantic_extraction_pipeline, codex_skills_graphify_references_query_graph_query_workflows, codex_skills_graphify_references_update_incremental_graph_update [EXTRACTED 1.00]
- **Predictotronix Operational Platform** — readme_supabase_backend, readme_render_deployment, readme_scheduled_sync_jobs, setup_render_cron_containers [INFERRED 0.85]
- **Predictotronix Quality Gate** — agents_verify_before_completion, github_workflows_ci_ci_pipeline, github_workflows_ci_verify_job [EXTRACTED 1.00]

## Communities (72 total, 11 thin omitted)

### Community 0 - "context.ts"
Cohesion: 0.20
Nodes (11): cookieOptions, setAdminLeague(), setAdminSeason(), stopViewingAsLeagueAdmin(), viewAsCookieOptions, viewAsLeagueAdmin(), ADMIN_LEAGUE_COOKIE, ADMIN_SEASON_COOKIE (+3 more)

### Community 1 - "send-reminders/route.ts"
Cohesion: 0.10
Nodes (28): claimReminderDelivery(), DeliveryClaim, dynamic, POST(), ServiceClient, validateCronSecret(), shouldDryRunNotifications(), BrandedEmailParams (+20 more)

### Community 2 - "fixtures/page.tsx"
Cohesion: 0.21
Nodes (10): dynamic, FixturesAdminPage(), metadata, metadata, NewSeasonPage(), dynamic, metadata, Props (+2 more)

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+27 more)

### Community 4 - "server.ts"
Cohesion: 0.07
Nodes (67): GET(), dynamic, ForgotPasswordPage(), metadata, submitJoinRequest(), dynamic, JoinPage(), Props (+59 more)

### Community 5 - "dependencies"
Cohesion: 0.04
Nodes (48): @base-ui/react, class-variance-authority, clsx, exceljs, lucide-react, next, dependencies, @base-ui/react (+40 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+21 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "Graphify Skill"
Cohesion: 0.11
Nodes (19): Graphify-First Codebase Navigation, Add and Watch Workflows, Graph Export Formats, Confidence and Provenance Classification, Semantic Extraction Specification, Cross-Repository Graph Merge, Graphify Hooks, Graph Query, Path, and Explain Workflows (+11 more)

### Community 9 - "Predictotronix"
Cohesion: 0.19
Nodes (14): Next.js Breaking Changes Guidance, API-Football Result Synchronization, Atomic Idempotent Prediction Scoring, Defence-in-Depth Kickoff Locking, Predictotronix, Premier League Prediction League, Render Deployment, Scheduled Fixture, Result, and Reminder Jobs (+6 more)

### Community 10 - "Predictotronix guide for superadmins"
Cohesion: 0.05
Nodes (38): 10. Complete, archive and delete safely, 11. Use test-season tools, 12. Routine operating checklists, 1. Always check the current workspace, 2. Create a league, 3. Manage invitations, 4. Assign a league admin, 5. Create and activate a season (+30 more)

### Community 11 - "QuickMatchGame.tsx"
Cohesion: 0.09
Nodes (24): Fixture, PredictionsForm(), Props, CHANCE_SEQUENCE, ChanceProfile, chanceProfileForRound(), ChanceResult, ChanceType (+16 more)

### Community 12 - "exports/page.tsx"
Cohesion: 0.19
Nodes (11): dynamic, ExportsAdminPage(), metadata, ExportPanel(), Format, formats, GameweekStandings, getMovementLabel() (+3 more)

### Community 13 - "Verify Before Completion"
Cohesion: 0.50
Nodes (5): Verify Before Completion, Agent Instructions Alias, CI Pipeline, Node.js 24 Runtime, Verify Job

### Community 14 - "app/layout.tsx"
Cohesion: 0.33
Nodes (3): geistMono, geistSans, metadata

### Community 15 - "Q: I have some issues with the admin UX, it feels like the screens are doing too much in one place, like the league settings screen having Create new league forms, deleting the leagues, setting admins etc... all in one place, it is just confusing. Could you look through all admin pages and think about a clearer approach? E.g having some tags or separate pages or modals where this makes sense."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I have some issues with the admin UX, it feels like the screens are doing too much in one place, like the league settings screen having Create new league forms, deleting the leagues, setting admins etc... all in one place, it is just confusing. Could you look through all admin pages and think about a clearer approach? E.g having some tags or separate pages or modals where this makes sense., Source Nodes

### Community 16 - "verify.mjs"
Cohesion: 0.50
Nodes (3): env, PLACEHOLDER_ENV, steps

### Community 18 - "Q: I have just spun up my staging environment and requested to join a league with a user, I can see the join request in my DB table, but it is not showing in the UI."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I have just spun up my staging environment and requested to join a league with a user, I can see the join request in my DB table, but it is not showing in the UI., Source Nodes

### Community 27 - "PlayerAccessibilityMode.tsx"
Cohesion: 0.27
Nodes (5): AccessibilityContext, AccessibilityContextValue, PlayerAccessibilityMode(), PlayerAccessibilityToggle(), readSavedPreference()

### Community 29 - "Q: Can you make the suggested changes?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you make the suggested changes?, Source Nodes

### Community 32 - "environment.ts"
Cohesion: 0.07
Nodes (38): assertCount(), ensurePersonaUser(), insertBatches(), main(), requiredEnvironment(), scoreCompletedFixtures(), addDays(), buildStagingScenario() (+30 more)

### Community 37 - "local-dev.mjs"
Cohesion: 0.50
Nodes (4): local, next, status(), supabase()

### Community 38 - "Q: Why is my ability to make predictions being blocked? Also can you stop offline users being highlighted as (offline) in leaderboards/exports etc...?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why is my ability to make predictions being blocked? Also can you stop offline users being highlighted as (offline) in leaderboards/exports etc...?, Source Nodes

### Community 39 - "supabase-server.test.ts"
Cohesion: 0.50
Nodes (3): cookies, createServerClient, createSupabaseClient

### Community 40 - "Q: Why are they locked at all?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why are they locked at all?, Source Nodes

### Community 41 - "Q: Should I now be able to use the API sync to get the real fixtures for the upcoming season?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Should I now be able to use the API sync to get the real fixtures for the upcoming season?, Source Nodes

### Community 42 - "fpl/client.ts"
Cohesion: 0.17
Nodes (10): FplBootstrap, FplEvent, fplFetch(), FplFixture, FplFixtureProvider, fplSeason(), fplStatus(), FplTeam (+2 more)

### Community 43 - "leaderboard/[gameweekId]/page.tsx"
Cohesion: 0.40
Nodes (3): dynamic, metadata, Props

### Community 44 - "predictions/[gameweekId]/page.tsx"
Cohesion: 0.40
Nodes (3): dynamic, metadata, Props

### Community 46 - "season/route.ts"
Cohesion: 0.24
Nodes (11): dynamic, GET(), createSeasonWorkbook(), safeSheetName(), SeasonWorkbookData, styleHeader(), titleRow(), WorkbookFixture (+3 more)

### Community 47 - "Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing., Source Nodes

### Community 48 - "participants/page.tsx"
Cohesion: 0.14
Nodes (19): dynamic, metadata, Props, createOfflineParticipant(), dynamic, metadata, ParticipantsAdminPage(), Props (+11 more)

### Community 50 - "Q: How do I assign a user to a league from the admin panel?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How do I assign a user to a league from the admin panel?, Source Nodes

### Community 52 - "Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?, Source Nodes

### Community 53 - "opengraph-image.tsx"
Cohesion: 0.43
Nodes (4): alt, contentType, scores, size

### Community 54 - "api-football/client.ts"
Cohesion: 0.22
Nodes (8): apiFetch(), ApiFootballConfig, ApiFootballEnvelope, ApiFootballProvider, formatApiErrors(), getApiFootballConfig(), getSafeRequestDiagnostics(), RateLimitState

### Community 55 - "Q: Can you talk me through the proposed changes to the flow to make this work?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you talk me through the proposed changes to the flow to make this work?, Source Nodes

### Community 56 - "Predictotronix guide for players"
Cohesion: 0.15
Nodes (12): 1. Join your league, 2. Find the correct gameweek, 3. Make and save predictions, 4. Deadlines and locked fixtures, 5. Results and scoring, 6. Notification settings, 7. Display and account controls, If you already have an account (+4 more)

### Community 57 - "Predictotronix guide for league admins"
Cohesion: 0.18
Nodes (10): 1. Open and select the workspace, 2. Manage seasons, 3. Manage people, 4. Manage predictions, 5. Manage fixtures and results, 6. Review and export standings, Predictotronix guide for league admins, Quick reference (+2 more)

### Community 58 - "Q: Give me a nice way to copy the invite link to the clipboard."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Give me a nice way to copy the invite link to the clipboard., Source Nodes

### Community 59 - "FixtureClipboardExport.tsx"
Cohesion: 0.21
Nodes (14): CopyStatus, datePartsFormatter, exportWeekdays, FixtureClipboardExport(), fixtureDateHeading(), FixtureExportGameweek, FixtureStatus, formatFixtureExport() (+6 more)

### Community 60 - "AdminShell.tsx"
Cohesion: 0.18
Nodes (9): AdminShell(), configureNav, NavItem, Option, Props, runNav, SeasonOption, systemNav (+1 more)

### Community 61 - "predictions/actions.ts"
Cohesion: 0.07
Nodes (41): AdminPredictionsPage(), dynamic, metadata, Props, AdminPredictionsForm(), Fixture, Option, ParticipantOption (+33 more)

### Community 62 - "getAdminContext"
Cohesion: 0.23
Nodes (10): LeagueDetailPage(), LeaguesAdminPage(), AdminDashboardPage(), dynamic, metadata, SeasonsAdminPage(), SeasonDetailPage(), AdminLayout() (+2 more)

### Community 64 - "types/index.ts"
Cohesion: 0.08
Nodes (26): calculateCompletion(), getResult(), LeaderboardEntry, RankedEntry, rankLeaderboard(), Result, Score, scorePrediction() (+18 more)

### Community 65 - "ApiFixture"
Cohesion: 0.33
Nodes (3): TestFixtureProvider, ApiFixture, ApiRound

### Community 66 - "fixtures/actions.ts"
Cohesion: 0.27
Nodes (11): actionLogger(), assertExternalFixtureSyncEnabled(), correctResult(), failureEntry(), getProductionSeason(), SyncActionState, triggerFixtureSync(), triggerResultSync() (+3 more)

### Community 67 - "fixtures.ts"
Cohesion: 0.33
Nodes (8): gameweekNumberFromRound(), log(), mapFixtureStatus(), syncFixtures(), SyncLogger, SyncLogLevel, SyncResult, syncResults()

### Community 68 - "getEnvironmentPolicy"
Cohesion: 0.47
Nodes (6): POST(), validateCronSecret(), POST(), validateCronSecret(), getEnvironmentPolicy(), createProductionFixtureProvider()

### Community 69 - "createServiceClient"
Cohesion: 0.07
Nodes (55): assignLeagueAdmin(), createLeague(), deleteLeague(), regenerateInviteCode(), toggleInviteActive(), dynamic, LeagueTab, approveJoinRequest() (+47 more)

### Community 70 - "Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?, Source Nodes

### Community 71 - "Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results., Source Nodes

## Knowledge Gaps
- **392 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+387 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `ParticipantsAdminPage()` (6× useful, score=4.678386636)
- `DashboardPage()` (3× useful, score=2.331667021)
- `submitJoinRequest()` (3× useful, score=2.315487322)
- `PredictionsForm()` (2× useful, score=1.688472441)
- `SeasonsAdminPage()` (2× useful, score=1.581826405)
- `AdminShell()` (2× useful, score=1.581826405)
- `approveJoinRequest()` (2× useful, score=1.575918267)
- `JoinPage()` (2× useful, score=1.575508215)
- `LoginPage()` (2× useful, score=1.575508215)
- `RegisterPage()` (2× useful, score=1.575508215)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `createServiceClient` to `context.ts`, `send-reminders/route.ts`, `fixtures/actions.ts`, `fixtures/page.tsx`, `getEnvironmentPolicy`, `server.ts`, `exports/page.tsx`, `season/route.ts`, `participants/page.tsx`, `predictions/actions.ts`, `getAdminContext`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `ApiFixture` connect `ApiFixture` to `fixtures.ts`, `getEnvironmentPolicy`, `fpl/client.ts`, `api-football/client.ts`, `FixtureProvider`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `createClient()` connect `server.ts` to `predictions/actions.ts`, `createServiceClient`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _392 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `send-reminders/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0990990990990991 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0681635926222935 - nodes in this community are weakly interconnected._