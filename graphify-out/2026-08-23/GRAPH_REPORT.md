# Graph Report - predictotronix  (2026-08-23)

## Corpus Check
- 199 files · ~80,154 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1016 nodes · 1950 edges · 73 communities (63 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `381bd3bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- leaderboard.ts
- send-reminders/route.ts
- server.ts
- devDependencies
- auth/actions.ts
- dependencies
- compilerOptions
- components.json
- Graphify Skill
- Predictotronix
- Predictotronix guide for superadmins
- QuickMatchGame.tsx
- [leagueId]/page.tsx
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
- scenario.mts
- local-dev.mjs
- Q: Why is my ability to make predictions being blocked? Also can you stop offline users being highlighted as (offline) in leaderboards/exports etc...?
- supabase-server.test.ts
- Q: Why are they locked at all?
- Q: Should I now be able to use the API sync to get the real fixtures for the upcoming season?
- ApiFixture
- leaderboard/[gameweekId]/page.tsx
- predictions/[gameweekId]/page.tsx
- leaderboard/page.tsx
- context.ts
- Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing.
- getAdminContext
- Q: How do I assign a user to a league from the admin panel?
- Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?
- opengraph-image.tsx
- run.ts
- Q: Can you talk me through the proposed changes to the flow to make this work?
- Predictotronix guide for players
- Predictotronix guide for league admins
- Q: Give me a nice way to copy the invite link to the clipboard.
- FixtureClipboardExport.tsx
- predictions/page.tsx
- email-import-parser.ts
- Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?
- InviteLinkCopy.tsx
- participants/page.tsx
- PredictionsForm.tsx
- fixtures.ts
- admin/page.tsx
- AdminPredictionsForm.tsx
- createServiceClient
- predictions/actions.ts
- dashboard/page.tsx
- Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results.

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 73 edges
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
- `main()` --calls--> `assertSafeStagingTarget()`  [EXTRACTED]
  scripts/staging/reset.mts → src/lib/environment.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Extraction and Query Lifecycle** — codex_skills_graphify_skill_ast_structural_extraction, codex_skills_graphify_skill_semantic_extraction_pipeline, codex_skills_graphify_references_query_graph_query_workflows, codex_skills_graphify_references_update_incremental_graph_update [EXTRACTED 1.00]
- **Predictotronix Operational Platform** — readme_supabase_backend, readme_render_deployment, readme_scheduled_sync_jobs, setup_render_cron_containers [INFERRED 0.85]
- **Predictotronix Quality Gate** — agents_verify_before_completion, github_workflows_ci_ci_pipeline, github_workflows_ci_verify_job [EXTRACTED 1.00]

## Communities (73 total, 10 thin omitted)

### Community 0 - "leaderboard.ts"
Cohesion: 0.07
Nodes (39): dynamic, ExportsAdminPage(), metadata, contentType(), GET(), validFormats, dynamic, GET() (+31 more)

### Community 1 - "send-reminders/route.ts"
Cohesion: 0.10
Nodes (28): claimReminderDelivery(), DeliveryClaim, dynamic, POST(), ServiceClient, validateCronSecret(), BrandedEmailParams, EmailResult (+20 more)

### Community 2 - "server.ts"
Cohesion: 0.33
Nodes (12): DashboardPage(), saveNotificationPreferences(), dynamic, metadata, SettingsPage(), getParticipant(), isAdmin(), isSeasonParticipant() (+4 more)

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+27 more)

### Community 4 - "auth/actions.ts"
Cohesion: 0.09
Nodes (47): GET(), dynamic, ForgotPasswordPage(), metadata, submitJoinRequest(), dynamic, JoinPage(), Props (+39 more)

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
Cohesion: 0.17
Nodes (14): CHANCE_SEQUENCE, ChanceProfile, chanceProfileForRound(), ChanceResult, ChanceType, createTargetPosition(), GamePhase, markerPositionAtElapsed() (+6 more)

### Community 12 - "[leagueId]/page.tsx"
Cohesion: 0.32
Nodes (11): assignLeagueAdmin(), createLeague(), deleteLeague(), regenerateInviteCode(), toggleInviteActive(), dynamic, LeagueTab, dynamic (+3 more)

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

### Community 32 - "scenario.mts"
Cohesion: 0.14
Nodes (23): assertCount(), ensurePersonaUser(), insertBatches(), main(), requiredEnvironment(), scoreCompletedFixtures(), addDays(), buildStagingScenario() (+15 more)

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

### Community 42 - "ApiFixture"
Cohesion: 0.07
Nodes (23): apiFetch(), ApiFootballConfig, ApiFootballEnvelope, ApiFootballProvider, formatApiErrors(), getApiFootballConfig(), getSafeRequestDiagnostics(), RateLimitState (+15 more)

### Community 43 - "leaderboard/[gameweekId]/page.tsx"
Cohesion: 0.40
Nodes (3): dynamic, metadata, Props

### Community 44 - "predictions/[gameweekId]/page.tsx"
Cohesion: 0.40
Nodes (3): dynamic, metadata, Props

### Community 46 - "context.ts"
Cohesion: 0.10
Nodes (21): cookieOptions, setAdminLeague(), setAdminSeason(), stopViewingAsLeagueAdmin(), viewAsCookieOptions, viewAsLeagueAdmin(), AdminLayout(), AdminShell() (+13 more)

### Community 47 - "Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing., Source Nodes

### Community 48 - "getAdminContext"
Cohesion: 0.11
Nodes (30): dynamic, FixturesAdminPage(), metadata, LeagueDetailPage(), dynamic, LeaguesAdminPage(), metadata, Props (+22 more)

### Community 50 - "Q: How do I assign a user to a league from the admin panel?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How do I assign a user to a league from the admin panel?, Source Nodes

### Community 52 - "Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?, Source Nodes

### Community 53 - "opengraph-image.tsx"
Cohesion: 0.43
Nodes (4): alt, contentType, scores, size

### Community 54 - "run.ts"
Cohesion: 0.06
Nodes (43): buildCronDiagnosticPrompt(), CronJobRunStatus, CronJobStatusPanel(), formatDuration(), formatUtc(), statusStyles, CRON_JOBS, CronJobName (+35 more)

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

### Community 60 - "predictions/page.tsx"
Cohesion: 0.21
Nodes (11): AdminPredictionsPage(), dynamic, metadata, Props, getSeasonNow(), hasValidScores(), submitPredictions(), PredictionFixture (+3 more)

### Community 61 - "email-import-parser.ts"
Cohesion: 0.16
Nodes (20): adminExtractEmailPredictions(), ExtractEmailPredictionsResult, ChatCompletionResponse, extractPredictionsWithLlm(), getPredictionImportLlmConfig(), LlmConfig, LlmExtractionResult, aliasesFor() (+12 more)

### Community 62 - "Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?, Source Nodes

### Community 63 - "InviteLinkCopy.tsx"
Cohesion: 0.40
Nodes (4): CopyStatus, InviteLinkCopy(), Props, writeText

### Community 64 - "participants/page.tsx"
Cohesion: 0.22
Nodes (16): approveJoinRequest(), createOfflineParticipant(), rejectJoinRequest(), updateParticipantDisplayName(), dynamic, metadata, ParticipantsAdminPage(), Props (+8 more)

### Community 65 - "PredictionsForm.tsx"
Cohesion: 0.18
Nodes (10): Fixture, PredictionsForm(), Props, QuickMatchFixture, SCORE_WEIGHTS, TOTAL_WEIGHT, weightedRandomScore(), { clearPredictionsMock, submitPredictionsMock } (+2 more)

### Community 66 - "fixtures.ts"
Cohesion: 0.07
Nodes (47): main(), requiredEnvironment(), actionLogger(), assertExternalFixtureSyncEnabled(), correctResult(), failureEntry(), getProductionSeason(), SyncActionState (+39 more)

### Community 67 - "admin/page.tsx"
Cohesion: 0.50
Nodes (3): AdminDashboardPage(), dynamic, metadata

### Community 68 - "AdminPredictionsForm.tsx"
Cohesion: 0.24
Nodes (7): AdminPredictionsForm(), Fixture, Option, ParticipantOption, Props, adminSubmitPredictions(), participants

### Community 69 - "createServiceClient"
Cohesion: 0.19
Nodes (19): clearSeasonClock(), fastForwardGameweek(), guardActiveSeason(), guardTestSeason(), injectResult(), markFixturePostponed(), requireStagingSuperAdmin(), requireSuperAdmin() (+11 more)

### Community 70 - "predictions/actions.ts"
Cohesion: 0.33
Nodes (8): notFound(), requireLeagueAdminForFixture(), requireLeagueAdminForFixtures(), requireLeagueAdminForGameweek(), ClearPredictionsResult, PredictionInput, SubmitPredictionsResult, { createServiceClient, requireLeagueAdmin, maybeSingle, inQuery }

### Community 71 - "dashboard/page.tsx"
Cohesion: 0.22
Nodes (8): ActiveSeason, dynamic, metadata, PendingJoinRequest, Props, GameweekCarousel(), Props, signOut()

### Community 74 - "Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results., Source Nodes

## Knowledge Gaps
- **397 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+392 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

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

- **Why does `createServiceClient()` connect `createServiceClient` to `leaderboard.ts`, `participants/page.tsx`, `fixtures.ts`, `admin/page.tsx`, `send-reminders/route.ts`, `auth/actions.ts`, `predictions/actions.ts`, `AdminPredictionsForm.tsx`, `server.ts`, `[leagueId]/page.tsx`, `context.ts`, `getAdminContext`, `run.ts`, `predictions/page.tsx`, `email-import-parser.ts`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `FplFixtureProvider` connect `ApiFixture` to `fixtures.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `FormSubmitButton()` connect `auth/actions.ts` to `participants/page.tsx`, `server.ts`, `createServiceClient`, `dashboard/page.tsx`, `[leagueId]/page.tsx`, `context.ts`, `getAdminContext`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _397 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `leaderboard.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07111756168359942 - nodes in this community are weakly interconnected._
- **Should `send-reminders/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0960960960960961 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._