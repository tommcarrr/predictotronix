# Graph Report - predictotronix  (2026-08-25)

## Corpus Check
- 231 files · ~94,405 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1162 nodes · 2240 edges · 93 communities (74 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- leaderboard.ts
- send-reminders/route.ts
- breakout-controls.test.ts
- devDependencies
- createClient
- dependencies
- compilerOptions
- components.json
- Graph Query, Path, and Explain Workflows
- Predictotronix Setup Guide
- Predictotronix guide for superadmins
- QuickMatchGame.tsx
- auth/index.ts
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
- FixtureClipboardExport.tsx
- Q: Can you make the suggested changes?
- global.setup.ts
- environment.ts
- local-dev.mjs
- Q: Why is my ability to make predictions being blocked? Also can you stop offline users being highlighted as (offline) in leaderboards/exports etc...?
- supabase-server.test.ts
- Q: Why are they locked at all?
- Q: Should I now be able to use the API sync to get the real fixtures for the upcoming season?
- ApiFixture
- leaderboard/[gameweekId]/page.tsx
- predictions/[gameweekId]/page.tsx
- leaderboard/page.tsx
- AdminShell.tsx
- Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing.
- test-tools/page.tsx
- Q: How do I assign a user to a league from the admin panel?
- Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?
- PredictionsForm.tsx
- CeefaxBreakout.tsx
- Q: Can you talk me through the proposed changes to the flow to make this work?
- Predictotronix guide for players
- fixtures/page.tsx
- Q: Give me a nice way to copy the invite link to the clipboard.
- fixtures.ts
- server.ts
- getUser
- Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?
- predictions/actions.ts
- dashboard/page.tsx
- createServiceClient
- Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?
- Q: I just played a legitimate game and got the error: Your score could not be verified or saved.
- getAdminContext
- email-import-parser.ts
- Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?
- Q: Oh, is there only one top score per user?
- InviteLinkCopy.tsx
- Predictotronix guide for league admins
- Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results.
- Q: I played for 5-10 minutes. Would the duration or speed changes fix the verification failure?
- Premier League Prediction League
- Semantic Extraction Specification
- Domain-Guided Whisper Prompt
- breakout-migration.test.ts
- Incremental Graph Update
- Honest Audit Trail
- Next.js Breaking Changes Guidance
- Add and Watch Workflows
- Graph Export Formats
- Cross-Repository Graph Merge
- Graphify Hooks
- AST Structural Extraction
- login-notices.ts
- notices/page.tsx
- Q: Add league/global admin login notices with Ceefax theming, expiry, and dismissal frequency.
- scoring/index.ts
- Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive.

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 78 edges
2. `createClient()` - 34 edges
3. `getAdminContext` - 30 edges
4. `getUser` - 30 edges
5. `normalizeInviteCode()` - 25 edges
6. `requireLeagueAdminForSeason()` - 22 edges
7. `requireUser()` - 22 edges
8. `isSuperAdmin()` - 21 edges
9. `FormSubmitButton()` - 18 edges
10. `ApiFixture` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Graphify-First Codebase Navigation` --semantically_similar_to--> `Existing Graph Fast Path`  [INFERRED] [semantically similar]
  AGENTS.md → .codex/skills/graphify/SKILL.md
- `Verify Before Completion` --semantically_similar_to--> `Verify Job`  [INFERRED] [semantically similar]
  AGENTS.md → .github/workflows/ci.yml
- `Render Cron Containers` --semantically_similar_to--> `Scheduled Fixture, Result, and Reminder Jobs`  [INFERRED] [semantically similar]
  SETUP.md → README.md
- `main()` --calls--> `assertSafeStagingTarget()`  [EXTRACTED]
  scripts/staging/reset.mts → src/lib/environment.ts
- `main()` --calls--> `assertSafeStagingTarget()`  [EXTRACTED]
  scripts/staging/smoke.mts → src/lib/environment.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Extraction and Query Lifecycle** — codex_skills_graphify_skill_ast_structural_extraction, codex_skills_graphify_skill_semantic_extraction_pipeline, codex_skills_graphify_references_query_graph_query_workflows, codex_skills_graphify_references_update_incremental_graph_update [EXTRACTED 1.00]
- **Predictotronix Operational Platform** — readme_supabase_backend, readme_render_deployment, readme_scheduled_sync_jobs, setup_render_cron_containers [INFERRED 0.85]
- **Predictotronix Quality Gate** — agents_verify_before_completion, github_workflows_ci_ci_pipeline, github_workflows_ci_verify_job [EXTRACTED 1.00]

## Communities (93 total, 19 thin omitted)

### Community 0 - "leaderboard.ts"
Cohesion: 0.07
Nodes (39): dynamic, ExportsAdminPage(), metadata, contentType(), GET(), validFormats, dynamic, GET() (+31 more)

### Community 1 - "send-reminders/route.ts"
Cohesion: 0.06
Nodes (44): claimReminderDelivery(), DeliveryClaim, dynamic, POST(), ServiceClient, validateCronSecret(), alt, contentType (+36 more)

### Community 2 - "breakout-controls.test.ts"
Cohesion: 0.50
Nodes (3): component, rules, styles

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+27 more)

### Community 4 - "createClient"
Cohesion: 0.06
Nodes (61): GET(), dynamic, ForgotPasswordPage(), metadata, submitJoinRequest(), dynamic, JoinPage(), Props (+53 more)

### Community 5 - "dependencies"
Cohesion: 0.04
Nodes (48): @base-ui/react, class-variance-authority, clsx, exceljs, lucide-react, next, dependencies, @base-ui/react (+40 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+21 more)

### Community 7 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "Graph Query, Path, and Explain Workflows"
Cohesion: 0.50
Nodes (4): Graphify-First Codebase Navigation, Graph Query, Path, and Explain Workflows, Self-Improving Query Memory, Existing Graph Fast Path

### Community 9 - "Predictotronix Setup Guide"
Cohesion: 0.33
Nodes (7): Render Deployment, Scheduled Fixture, Result, and Reminder Jobs, Supabase Auth and Postgres Backend, Ordered Database Migrations, Predictotronix Setup Guide, Render Cron Containers, Service-Role Secret Handling

### Community 10 - "Predictotronix guide for superadmins"
Cohesion: 0.05
Nodes (38): 10. Complete, archive and delete safely, 11. Use test-season tools, 12. Routine operating checklists, 1. Always check the current workspace, 2. Create a league, 3. Manage invitations, 4. Assign a league admin, 5. Create and activate a season (+30 more)

### Community 11 - "QuickMatchGame.tsx"
Cohesion: 0.17
Nodes (14): CHANCE_SEQUENCE, ChanceProfile, chanceProfileForRound(), ChanceResult, ChanceType, createTargetPosition(), GamePhase, markerPositionAtElapsed() (+6 more)

### Community 12 - "auth/index.ts"
Cohesion: 0.27
Nodes (10): AdminLayout(), dismissLoginNotice(), saveNotificationPreferences(), dynamic, metadata, SettingsPage(), getParticipant(), isSeasonParticipant() (+2 more)

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

### Community 27 - "FixtureClipboardExport.tsx"
Cohesion: 0.21
Nodes (14): CopyStatus, datePartsFormatter, exportWeekdays, FixtureClipboardExport(), fixtureDateHeading(), FixtureExportGameweek, FixtureStatus, formatFixtureExport() (+6 more)

### Community 29 - "Q: Can you make the suggested changes?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you make the suggested changes?, Source Nodes

### Community 32 - "environment.ts"
Cohesion: 0.07
Nodes (40): assertCount(), ensurePersonaUser(), insertBatches(), main(), requiredEnvironment(), scoreCompletedFixtures(), addDays(), buildStagingScenario() (+32 more)

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

### Community 46 - "AdminShell.tsx"
Cohesion: 0.09
Nodes (22): setAdminLeague(), setAdminSeason(), AdminShell(), configureNav, NavItem, Option, Props, runNav (+14 more)

### Community 47 - "Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing., Source Nodes

### Community 48 - "test-tools/page.tsx"
Cohesion: 0.19
Nodes (17): clearSeasonClock(), fastForwardGameweek(), guardActiveSeason(), guardTestSeason(), injectResult(), markFixturePostponed(), requireStagingSuperAdmin(), requireSuperAdmin() (+9 more)

### Community 50 - "Q: How do I assign a user to a league from the admin panel?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How do I assign a user to a league from the admin panel?, Source Nodes

### Community 52 - "Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?, Source Nodes

### Community 53 - "PredictionsForm.tsx"
Cohesion: 0.16
Nodes (11): Fixture, PredictionsForm(), Props, QuickMatchFixture, clearPredictions(), SCORE_WEIGHTS, TOTAL_WEIGHT, weightedRandomScore() (+3 more)

### Community 54 - "CeefaxBreakout.tsx"
Cohesion: 0.09
Nodes (42): Ball, Brick, CeefaxBreakout(), createBricks(), createGame(), displayName(), drawFootball(), drawGame() (+34 more)

### Community 55 - "Q: Can you talk me through the proposed changes to the flow to make this work?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you talk me through the proposed changes to the flow to make this work?, Source Nodes

### Community 56 - "Predictotronix guide for players"
Cohesion: 0.15
Nodes (12): 1. Join your league, 2. Find the correct gameweek, 3. Make and save predictions, 4. Deadlines and locked fixtures, 5. Results and scoring, 6. Notification settings, 7. Display and account controls, If you already have an account (+4 more)

### Community 57 - "fixtures/page.tsx"
Cohesion: 0.14
Nodes (21): dynamic, FixturesAdminPage(), metadata, dynamic, LeaguesAdminPage(), metadata, Props, metadata (+13 more)

### Community 58 - "Q: Give me a nice way to copy the invite link to the clipboard."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Give me a nice way to copy the invite link to the clipboard., Source Nodes

### Community 59 - "fixtures.ts"
Cohesion: 0.06
Nodes (55): actionLogger(), assertExternalFixtureSyncEnabled(), correctResult(), failureEntry(), getProductionSeason(), SyncActionState, triggerFixtureSync(), triggerResultSync() (+47 more)

### Community 60 - "server.ts"
Cohesion: 0.23
Nodes (9): cookieOptions, stopViewingAsLeagueAdmin(), viewAsCookieOptions, viewAsLeagueAdmin(), ADMIN_LEAGUE_COOKIE, ADMIN_SEASON_COOKIE, ADMIN_VIEW_AS_LEAGUE_COOKIE, AdminContext (+1 more)

### Community 61 - "getUser"
Cohesion: 0.32
Nodes (11): assignLeagueAdmin(), createLeague(), deleteLeague(), regenerateInviteCode(), toggleInviteActive(), dynamic, LeagueTab, dynamic (+3 more)

### Community 62 - "Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?, Source Nodes

### Community 63 - "predictions/actions.ts"
Cohesion: 0.13
Nodes (20): AdminPredictionsForm(), Fixture, Option, ParticipantOption, Props, adminExtractEmailPredictions(), adminSubmitPredictions(), ClearPredictionsResult (+12 more)

### Community 64 - "dashboard/page.tsx"
Cohesion: 0.12
Nodes (20): AdminPredictionsPage(), dynamic, metadata, Props, ActiveSeason, DashboardPage(), dynamic, metadata (+12 more)

### Community 65 - "createServiceClient"
Cohesion: 0.25
Nodes (16): approveJoinRequest(), createOfflineParticipant(), rejectJoinRequest(), updateParticipantDisplayName(), dynamic, metadata, ParticipantsAdminPage(), Props (+8 more)

### Community 66 - "Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?, Source Nodes

### Community 67 - "Q: I just played a legitimate game and got the error: Your score could not be verified or saved."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I just played a legitimate game and got the error: Your score could not be verified or saved., Source Nodes

### Community 68 - "getAdminContext"
Cohesion: 0.17
Nodes (14): LeagueDetailPage(), AdminDashboardPage(), dynamic, metadata, dynamic, metadata, Props, SeasonsAdminPage() (+6 more)

### Community 69 - "email-import-parser.ts"
Cohesion: 0.30
Nodes (12): aliasesFor(), aliasPattern(), candidateSegments(), collectFixtureScores(), EmailImportFixture, EmailParseResult, escapeRegExp(), generatedAliases() (+4 more)

### Community 70 - "Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?, Source Nodes

### Community 71 - "Q: Oh, is there only one top score per user?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Oh, is there only one top score per user?, Source Nodes

### Community 72 - "InviteLinkCopy.tsx"
Cohesion: 0.40
Nodes (4): CopyStatus, InviteLinkCopy(), Props, writeText

### Community 73 - "Predictotronix guide for league admins"
Cohesion: 0.18
Nodes (10): 1. Open and select the workspace, 2. Manage seasons, 3. Manage people, 4. Manage predictions, 5. Manage fixtures and results, 6. Review and export standings, Predictotronix guide for league admins, Quick reference (+2 more)

### Community 74 - "Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results., Source Nodes

### Community 75 - "Q: I played for 5-10 minutes. Would the duration or speed changes fix the verification failure?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I played for 5-10 minutes. Would the duration or speed changes fix the verification failure?, Source Nodes

### Community 76 - "Premier League Prediction League"
Cohesion: 0.40
Nodes (5): API-Football Result Synchronization, Atomic Idempotent Prediction Scoring, Defence-in-Depth Kickoff Locking, Premier League Prediction League, Test Season Isolation

### Community 77 - "Semantic Extraction Specification"
Cohesion: 0.67
Nodes (3): Confidence and Provenance Classification, Semantic Extraction Specification, Semantic Extraction Pipeline

### Community 79 - "breakout-migration.test.ts"
Cohesion: 0.50
Nodes (3): originalMigration, relaxedLimitsMigration, verifiedMigration

### Community 88 - "login-notices.ts"
Cohesion: 0.15
Nodes (16): LoginNotices(), VisibleLoginNotice, DEFAULT_LOGIN_NOTICE_DURATION_MS, formatLondonDateTimeLocal(), isLoginNoticeDismissed(), LOGIN_NOTICE_DISPLAY_MODES, LOGIN_NOTICE_TONES, LoginNoticeDismissal (+8 more)

### Community 89 - "notices/page.tsx"
Cohesion: 0.27
Nodes (10): canManageScope(), createLoginNotice(), expireLoginNotice(), redirectWithError(), dynamic, LoginNoticesAdminPage(), metadata, Props (+2 more)

### Community 90 - "Q: Add league/global admin login notices with Ceefax theming, expiry, and dismissal frequency."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Add league/global admin login notices with Ceefax theming, expiry, and dismissal frequency., Source Nodes

### Community 91 - "scoring/index.ts"
Cohesion: 0.27
Nodes (10): calculateCompletion(), getResult(), LeaderboardEntry, RankedEntry, rankLeaderboard(), Result, Score, scorePrediction() (+2 more)

### Community 93 - "Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive., Source Nodes

## Knowledge Gaps
- **457 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+452 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `ParticipantsAdminPage()` (6× useful, score=4.579468616)
- `CeefaxBreakout()` (3× useful, score=2.995891503) _(code changed — re-verify)_
- `DashboardPage()` (3× useful, score=2.282367144) _(code changed — re-verify)_
- `submitJoinRequest()` (3× useful, score=2.266529542)
- `getBreakoutLeaderboard()` (2× useful, score=1.997134484) _(code changed — re-verify)_
- `PredictionsForm()` (2× useful, score=1.652772025)
- `SeasonsAdminPage()` (2× useful, score=1.548380872)
- `AdminShell()` (2× useful, score=1.548380872) _(code changed — re-verify)_
- `approveJoinRequest()` (2× useful, score=1.542597653)
- `JoinPage()` (2× useful, score=1.542196271)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `createServiceClient` to `leaderboard.ts`, `notices/page.tsx`, `dashboard/page.tsx`, `send-reminders/route.ts`, `getAdminContext`, `createClient`, `AdminShell.tsx`, `test-tools/page.tsx`, `fixtures/page.tsx`, `fixtures.ts`, `server.ts`, `getUser`, `predictions/actions.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `FixtureProvider` connect `ApiFixture` to `fixtures.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `dashboard/page.tsx`, `createServiceClient`, `auth/index.ts`, `PredictionsForm.tsx`, `CeefaxBreakout.tsx`, `server.ts`, `getUser`, `predictions/actions.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _457 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `leaderboard.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07111756168359942 - nodes in this community are weakly interconnected._
- **Should `send-reminders/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06291591046581972 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._