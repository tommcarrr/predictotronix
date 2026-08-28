# Graph Report - predictotronix  (2026-08-27)

## Corpus Check
- 249 files · ~103,979 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1266 nodes · 2488 edges · 100 communities (79 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- leaderboard.ts
- email.ts
- breakout-controls.test.ts
- devDependencies
- auth/actions.ts
- dependencies
- compilerOptions
- components.json
- Graph Query, Path, and Explain Workflows
- Predictotronix Setup Guide
- Predictotronix guide for superadmins
- QuickMatchGame.tsx
- CeefaxBreakout.tsx
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
- email-import-parser.ts
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
- AdminShell.tsx
- Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing.
- test-tools/page.tsx
- Q: How do I assign a user to a league from the admin panel?
- Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?
- predictions/actions.ts
- fixtures.ts
- Q: Can you talk me through the proposed changes to the flow to make this work?
- Predictotronix guide for players
- fixtures/page.tsx
- Q: Give me a nice way to copy the invite link to the clipboard.
- scoring/index.ts
- participants/page.tsx
- send-reminders/route.ts
- Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?
- createServiceClient
- dashboard/page.tsx
- context.ts
- Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?
- Q: I just played a legitimate game and got the error: Your score could not be verified or saved.
- login-notices.ts
- Q: The easter-egg prompt belongs on the player dashboard, and the cookie must suppress only prompts rather than game entry.
- Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?
- Q: Oh, is there only one top score per user?
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
- Q: On the dashboard screen, reduce the theme-button easter egg to four clicks, invite a click after 30 seconds with escalating intensity, and suppress repeats for a few months with a cookie.
- Q: How could someone be showing up as Unknown Participant?
- Q: Add league/global admin login notices with Ceefax theming, expiry, and dismissal frequency.
- gameweek-workbook.ts
- Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive.
- server.ts
- Q: Can you exclude any results that are not ascribed to a person who is actively a part of the league/season?
- Q: Make the player dashboard easter-egg animation more elaborate every 30 seconds, including red flashing, spinning, and pulsing.
- getAdminContext
- InviteLinkCopy.tsx
- cookies/page.tsx
- privacy/page.tsx
- getUser

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 80 edges
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

## Communities (100 total, 21 thin omitted)

### Community 0 - "leaderboard.ts"
Cohesion: 0.07
Nodes (38): dynamic, ExportsAdminPage(), metadata, contentType(), GET(), validFormats, dynamic, GET() (+30 more)

### Community 1 - "email.ts"
Cohesion: 0.12
Nodes (25): alt, contentType, OpenGraphImage(), revalidate, scores, size, revalidate, getDailySocialShareVariant() (+17 more)

### Community 2 - "breakout-controls.test.ts"
Cohesion: 0.50
Nodes (3): component, rules, styles

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+27 more)

### Community 4 - "auth/actions.ts"
Cohesion: 0.08
Nodes (49): GET(), dynamic, ForgotPasswordPage(), metadata, submitJoinRequest(), dynamic, JoinPage(), Props (+41 more)

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
Cohesion: 0.09
Nodes (24): Fixture, PredictionsForm(), Props, CHANCE_SEQUENCE, ChanceProfile, chanceProfileForRound(), ChanceResult, ChanceType (+16 more)

### Community 12 - "CeefaxBreakout.tsx"
Cohesion: 0.09
Nodes (36): Ball, Brick, CeefaxBreakout(), createBricks(), createGame(), displayName(), drawFootball(), drawGame() (+28 more)

### Community 13 - "Verify Before Completion"
Cohesion: 0.50
Nodes (5): Verify Before Completion, Agent Instructions Alias, CI Pipeline, Node.js 24 Runtime, Verify Job

### Community 14 - "app/layout.tsx"
Cohesion: 0.29
Nodes (4): geistMono, geistSans, metadata, SiteFooter()

### Community 15 - "Q: I have some issues with the admin UX, it feels like the screens are doing too much in one place, like the league settings screen having Create new league forms, deleting the leagues, setting admins etc... all in one place, it is just confusing. Could you look through all admin pages and think about a clearer approach? E.g having some tags or separate pages or modals where this makes sense."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I have some issues with the admin UX, it feels like the screens are doing too much in one place, like the league settings screen having Create new league forms, deleting the leagues, setting admins etc... all in one place, it is just confusing. Could you look through all admin pages and think about a clearer approach? E.g having some tags or separate pages or modals where this makes sense., Source Nodes

### Community 16 - "verify.mjs"
Cohesion: 0.50
Nodes (3): env, PLACEHOLDER_ENV, steps

### Community 18 - "Q: I have just spun up my staging environment and requested to join a league with a user, I can see the join request in my DB table, but it is not showing in the UI."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I have just spun up my staging environment and requested to join a league with a user, I can see the join request in my DB table, but it is not showing in the UI., Source Nodes

### Community 27 - "email-import-parser.ts"
Cohesion: 0.30
Nodes (12): aliasesFor(), aliasPattern(), candidateSegments(), collectFixtureScores(), EmailImportFixture, EmailParseResult, escapeRegExp(), generatedAliases() (+4 more)

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

### Community 46 - "AdminShell.tsx"
Cohesion: 0.08
Nodes (28): setAdminLeague(), setAdminSeason(), AdminShell(), configureNav, NavItem, Option, Props, runNav (+20 more)

### Community 47 - "Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing., Source Nodes

### Community 48 - "test-tools/page.tsx"
Cohesion: 0.19
Nodes (16): clearSeasonClock(), fastForwardGameweek(), guardActiveSeason(), guardTestSeason(), injectResult(), markFixturePostponed(), requireStagingSuperAdmin(), sendTestNotification() (+8 more)

### Community 50 - "Q: How do I assign a user to a league from the admin panel?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How do I assign a user to a league from the admin panel?, Source Nodes

### Community 52 - "Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?, Source Nodes

### Community 53 - "predictions/actions.ts"
Cohesion: 0.12
Nodes (22): AdminPredictionsForm(), Fixture, Option, ParticipantOption, Props, getSeasonNow(), adminExtractEmailPredictions(), adminSubmitPredictions() (+14 more)

### Community 54 - "fixtures.ts"
Cohesion: 0.08
Nodes (41): actionLogger(), assertExternalFixtureSyncEnabled(), correctResult(), failureEntry(), getProductionSeason(), SyncActionState, triggerFixtureSync(), triggerResultSync() (+33 more)

### Community 55 - "Q: Can you talk me through the proposed changes to the flow to make this work?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you talk me through the proposed changes to the flow to make this work?, Source Nodes

### Community 56 - "Predictotronix guide for players"
Cohesion: 0.15
Nodes (12): 1. Join your league, 2. Find the correct gameweek, 3. Make and save predictions, 4. Deadlines and locked fixtures, 5. Results and scoring, 6. Notification settings, 7. Display and account controls, If you already have an account (+4 more)

### Community 57 - "fixtures/page.tsx"
Cohesion: 0.08
Nodes (36): dynamic, FixturesAdminPage(), metadata, buildCronDiagnosticPrompt(), CronJobRunStatus, CronJobStatusPanel(), formatDuration(), formatUtc() (+28 more)

### Community 58 - "Q: Give me a nice way to copy the invite link to the clipboard."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Give me a nice way to copy the invite link to the clipboard., Source Nodes

### Community 59 - "scoring/index.ts"
Cohesion: 0.33
Nodes (8): calculateCompletion(), getResult(), LeaderboardEntry, RankedEntry, rankLeaderboard(), Result, Score, scorePrediction()

### Community 60 - "participants/page.tsx"
Cohesion: 0.13
Nodes (28): dynamic, LeagueTab, dynamic, LeaguesAdminPage(), metadata, Props, dynamic, metadata (+20 more)

### Community 61 - "send-reminders/route.ts"
Cohesion: 0.05
Nodes (51): main(), requiredEnvironment(), claimReminderDelivery(), DeliveryClaim, dynamic, POST(), ServiceClient, validateCronSecret() (+43 more)

### Community 62 - "Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?, Source Nodes

### Community 63 - "createServiceClient"
Cohesion: 0.31
Nodes (12): approveJoinRequest(), createOfflineParticipant(), rejectJoinRequest(), updateParticipantDisplayName(), addSeasonParticipant(), createSeason(), deleteSeason(), removeSeasonParticipant() (+4 more)

### Community 64 - "dashboard/page.tsx"
Cohesion: 0.12
Nodes (18): AdminPredictionsPage(), dynamic, metadata, Props, ActiveSeason, DashboardPage(), dynamic, metadata (+10 more)

### Community 65 - "context.ts"
Cohesion: 0.24
Nodes (9): cookieOptions, stopViewingAsLeagueAdmin(), viewAsCookieOptions, viewAsLeagueAdmin(), ADMIN_LEAGUE_COOKIE, ADMIN_SEASON_COOKIE, ADMIN_VIEW_AS_LEAGUE_COOKIE, AdminContext (+1 more)

### Community 66 - "Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?, Source Nodes

### Community 67 - "Q: I just played a legitimate game and got the error: Your score could not be verified or saved."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I just played a legitimate game and got the error: Your score could not be verified or saved., Source Nodes

### Community 68 - "login-notices.ts"
Cohesion: 0.15
Nodes (17): LoginNotices(), VisibleLoginNotice, DEFAULT_LOGIN_NOTICE_DURATION_MS, formatLondonDateTimeLocal(), getLoginNoticeFormBounds(), isLoginNoticeDismissed(), LOGIN_NOTICE_DISPLAY_MODES, LOGIN_NOTICE_TONES (+9 more)

### Community 69 - "Q: The easter-egg prompt belongs on the player dashboard, and the cookie must suppress only prompts rather than game entry."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: The easter-egg prompt belongs on the player dashboard, and the cookie must suppress only prompts rather than game entry., Source Nodes

### Community 70 - "Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?, Source Nodes

### Community 71 - "Q: Oh, is there only one top score per user?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Oh, is there only one top score per user?, Source Nodes

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

### Community 88 - "Q: On the dashboard screen, reduce the theme-button easter egg to four clicks, invite a click after 30 seconds with escalating intensity, and suppress repeats for a few months with a cookie."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: On the dashboard screen, reduce the theme-button easter egg to four clicks, invite a click after 30 seconds with escalating intensity, and suppress repeats for a few months with a cookie., Source Nodes

### Community 89 - "Q: How could someone be showing up as Unknown Participant?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How could someone be showing up as Unknown Participant?, Source Nodes

### Community 90 - "Q: Add league/global admin login notices with Ceefax theming, expiry, and dismissal frequency."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Add league/global admin login notices with Ceefax theming, expiry, and dismissal frequency., Source Nodes

### Community 91 - "gameweek-workbook.ts"
Cohesion: 0.12
Nodes (46): dynamic, filenamePart(), GET(), addCompleteness(), addFixtureAnalysis(), addForecastTendencies(), addLeaderboard(), addNotes() (+38 more)

### Community 93 - "Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive., Source Nodes

### Community 94 - "server.ts"
Cohesion: 0.22
Nodes (18): AdminLayout(), dismissLoginNotice(), saveNotificationPreferences(), dynamic, metadata, SettingsPage(), getParticipant(), isAdmin() (+10 more)

### Community 95 - "Q: Can you exclude any results that are not ascribed to a person who is actively a part of the league/season?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you exclude any results that are not ascribed to a person who is actively a part of the league/season?, Source Nodes

### Community 96 - "Q: Make the player dashboard easter-egg animation more elaborate every 30 seconds, including red flashing, spinning, and pulsing."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Make the player dashboard easter-egg animation more elaborate every 30 seconds, including red flashing, spinning, and pulsing., Source Nodes

### Community 98 - "getAdminContext"
Cohesion: 0.15
Nodes (15): LeagueDetailPage(), dynamic, LoginNoticesAdminPage(), metadata, Props, toneOptions, AdminDashboardPage(), dynamic (+7 more)

### Community 99 - "InviteLinkCopy.tsx"
Cohesion: 0.40
Nodes (4): CopyStatus, InviteLinkCopy(), Props, writeText

### Community 102 - "getUser"
Cohesion: 0.27
Nodes (14): assignLeagueAdmin(), createLeague(), deleteLeague(), regenerateInviteCode(), toggleInviteActive(), canManageScope(), createLoginNotice(), expireLoginNotice() (+6 more)

## Knowledge Gaps
- **487 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+482 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `ParticipantsAdminPage()` (6× useful, score=4.236048371)
- `CeefaxBreakout()` (4× useful, score=3.697743112)
- `DashboardPage()` (4× useful, score=3.043737241)
- `FixturesAdminPage()` (3× useful, score=2.675789341)
- `AdminShell()` (3× useful, score=2.364793544) _(code changed — re-verify)_
- `submitJoinRequest()` (3× useful, score=2.096559575)
- `breakout-controls.test.ts` (2× useful, score=1.849352171)
- `getBreakoutLeaderboard()` (2× useful, score=1.847366799)
- `PredictionsForm()` (2× useful, score=1.528828524)
- `SeasonsAdminPage()` (2× useful, score=1.432265798)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `createServiceClient` to `leaderboard.ts`, `context.ts`, `getAdminContext`, `dashboard/page.tsx`, `auth/actions.ts`, `getUser`, `AdminShell.tsx`, `test-tools/page.tsx`, `predictions/actions.ts`, `fixtures.ts`, `fixtures/page.tsx`, `gameweek-workbook.ts`, `participants/page.tsx`, `send-reminders/route.ts`, `server.ts`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `ApiFixture` connect `ApiFixture` to `send-reminders/route.ts`, `fixtures.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `getSeasonNow()` connect `predictions/actions.ts` to `dashboard/page.tsx`, `fixtures/page.tsx`, `test-tools/page.tsx`, `send-reminders/route.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _487 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `leaderboard.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07164404223227752 - nodes in this community are weakly interconnected._
- **Should `email.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12473118279569892 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._