# Graph Report - predictotronix  (2026-09-03)

## Corpus Check
- 274 files · ~113,506 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1367 nodes · 2649 edges · 130 communities (92 shown, 38 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a60027b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- requireLeagueAdminForSeason
- send-reminders/route.ts
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
- login-notices.ts
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
- ApiFixture
- Q: Can you make the suggested changes?
- loginAs
- global.setup.ts
- scenario.mts
- local-dev.mjs
- Q: Why is my ability to make predictions being blocked? Also can you stop offline users being highlighted as (offline) in leaderboards/exports etc...?
- supabase-server.test.ts
- Q: Why are they locked at all?
- Q: Should I now be able to use the API sync to get the real fixtures for the upcoming season?
- predictions/actions.ts
- leaderboard/[gameweekId]/page.tsx
- predictions/[gameweekId]/page.tsx
- leaderboard/page.tsx
- AdminShell.tsx
- Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing.
- server.ts
- Q: How do I assign a user to a league from the admin panel?
- Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?
- Q: The 10am notifications didn't send again today. Can you have a look for any bugs?
- CeefaxBreakout.tsx
- Q: Can you talk me through the proposed changes to the flow to make this work?
- Predictotronix guide for players
- fixtures/page.tsx
- Q: Give me a nice way to copy the invite link to the clipboard.
- getAdminContext
- [seasonId]/page.tsx
- createServiceClient
- Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?
- document.ts
- scripts
- predictions/page.tsx
- Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?
- Q: I just played a legitimate game and got the error: Your score could not be verified or saved.
- notices/page.tsx
- Q: The easter-egg prompt belongs on the player dashboard, and the cookie must suppress only prompts rather than game entry.
- Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?
- Q: Oh, is there only one top score per user?
- Q: I've run migration 021, but the Unattached users tab is still unavailable
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
- package.json
- Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive.
- fixtures.ts
- Q: Can you exclude any results that are not ascribed to a person who is actively a part of the league/season?
- Q: Make the player dashboard easter-egg animation more elaborate every 30 seconds, including red flashing, spinning, and pulsing.
- participant-merge-migration.test.ts
- context.ts
- cookies/page.tsx
- privacy/page.tsx
- Q: I keep getting random people who I think are from bot accounts signing up to the site. How would I add some protection against this?
- participants/page.tsx
- getUser
- Q: Once you've done this, can you also fix the styling on the admin dashboard, the policy links appear right at the bottom below the menu and cause a vertical scrollbar. Surely they could just be links at the bottom of the menu.
- Q: In the admin screen, why does the header float in front of the breakout game?
- types/index.ts
- InviteLinkCopy.tsx
- unattached-users-migration.test.ts
- Q: The participants page is now giving React error 441 when I navigate to it
- eslint-config-next
- email-import-parser.ts
- unattached-users-fix-migration.test.ts
- @playwright/test
- prettier
- supabase
- @tailwindcss/postcss
- @testing-library/jest-dom
- @types/node
- @types/react
- @vitejs/plugin-react
- vitest
- gameweek-messages-migration.test.ts
- AdminPredictionsForm.tsx
- PredictionsForm.tsx
- ParticipantMergeDialog.tsx
- GameweekCarousel.tsx
- eslint

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 84 edges
2. `createClient()` - 36 edges
3. `getAdminContext` - 30 edges
4. `getUser` - 30 edges
5. `normalizeInviteCode()` - 25 edges
6. `requireUser()` - 24 edges
7. `requireLeagueAdminForSeason()` - 22 edges
8. `isSuperAdmin()` - 21 edges
9. `FormSubmitButton()` - 19 edges
10. `getParticipant()` - 19 edges

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

## Communities (130 total, 38 thin omitted)

### Community 0 - "requireLeagueAdminForSeason"
Cohesion: 0.07
Nodes (45): dynamic, ExportsAdminPage(), metadata, contentType(), GET(), validFormats, dynamic, GET() (+37 more)

### Community 1 - "send-reminders/route.ts"
Cohesion: 0.06
Nodes (46): claimReminderDelivery(), DeliveryClaim, dynamic, POST(), ServiceClient, validateCronSecret(), alt, contentType (+38 more)

### Community 2 - "breakout-controls.test.ts"
Cohesion: 0.50
Nodes (3): component, rules, styles

### Community 3 - "devDependencies"
Cohesion: 0.15
Nodes (13): jsdom, devDependencies, jsdom, tailwindcss, @testing-library/react, @types/react-dom, @types/testing-library__jest-dom, typescript (+5 more)

### Community 4 - "auth/actions.ts"
Cohesion: 0.09
Nodes (45): GET(), dynamic, ForgotPasswordPage(), metadata, submitJoinRequest(), dynamic, JoinPage(), Props (+37 more)

### Community 5 - "dependencies"
Cohesion: 0.04
Nodes (45): @base-ui/react, class-variance-authority, clsx, exceljs, lexical, @lexical/history, @lexical/list, @lexical/overflow (+37 more)

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
Cohesion: 0.16
Nodes (15): CHANCE_SEQUENCE, ChanceProfile, chanceProfileForRound(), ChanceResult, ChanceType, createTargetPosition(), GamePhase, markerPositionAtElapsed() (+7 more)

### Community 12 - "login-notices.ts"
Cohesion: 0.16
Nodes (15): LoginNotices(), VisibleLoginNotice, DEFAULT_LOGIN_NOTICE_DURATION_MS, formatLondonDateTimeLocal(), LOGIN_NOTICE_DISPLAY_MODES, LOGIN_NOTICE_TONES, LoginNoticeDismissal, LoginNoticeDisplayMode (+7 more)

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

### Community 27 - "ApiFixture"
Cohesion: 0.07
Nodes (23): apiFetch(), ApiFootballConfig, ApiFootballEnvelope, ApiFootballProvider, formatApiErrors(), getApiFootballConfig(), getSafeRequestDiagnostics(), RateLimitState (+15 more)

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

### Community 42 - "predictions/actions.ts"
Cohesion: 0.18
Nodes (17): getSeasonNow(), adminExtractEmailPredictions(), adminSubmitPredictions(), clearPredictions(), ClearPredictionsResult, ExtractEmailPredictionsResult, hasValidScores(), PredictionInput (+9 more)

### Community 43 - "leaderboard/[gameweekId]/page.tsx"
Cohesion: 0.40
Nodes (3): dynamic, metadata, Props

### Community 44 - "predictions/[gameweekId]/page.tsx"
Cohesion: 0.33
Nodes (5): dynamic, metadata, PredictionsPage(), Props, { redirect }

### Community 46 - "AdminShell.tsx"
Cohesion: 0.08
Nodes (29): setAdminLeague(), setAdminSeason(), AdminLayout(), AdminShell(), configureNav, NavItem, Option, Props (+21 more)

### Community 47 - "Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing., Source Nodes

### Community 48 - "server.ts"
Cohesion: 0.20
Nodes (19): dismissLoginNotice(), ActiveSeason, DashboardPage(), dynamic, metadata, PendingJoinRequest, Props, saveNotificationPreferences() (+11 more)

### Community 50 - "Q: How do I assign a user to a league from the admin panel?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How do I assign a user to a league from the admin panel?, Source Nodes

### Community 52 - "Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?, Source Nodes

### Community 53 - "Q: The 10am notifications didn't send again today. Can you have a look for any bugs?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: The 10am notifications didn't send again today. Can you have a look for any bugs?, Source Nodes

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
Cohesion: 0.08
Nodes (37): dynamic, FixturesAdminPage(), metadata, buildCronDiagnosticPrompt(), CronJobRunStatus, CronJobStatusPanel(), formatDuration(), formatUtc() (+29 more)

### Community 58 - "Q: Give me a nice way to copy the invite link to the clipboard."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Give me a nice way to copy the invite link to the clipboard., Source Nodes

### Community 59 - "getAdminContext"
Cohesion: 0.16
Nodes (15): LeagueDetailPage(), AdminDashboardPage(), dynamic, metadata, ParticipantsAdminPage(), dynamic, metadata, Props (+7 more)

### Community 60 - "[seasonId]/page.tsx"
Cohesion: 0.14
Nodes (20): dynamic, LeaguesAdminPage(), metadata, Props, deleteSeason(), updateSeasonStatus(), metadata, NewSeasonPage() (+12 more)

### Community 61 - "createServiceClient"
Cohesion: 0.23
Nodes (17): clearSeasonClock(), fastForwardGameweek(), guardActiveSeason(), guardTestSeason(), injectResult(), markFixturePostponed(), requireStagingSuperAdmin(), requireSuperAdmin() (+9 more)

### Community 62 - "Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?, Source Nodes

### Community 63 - "document.ts"
Cohesion: 0.19
Nodes (18): GameweekMessageEditor(), setFontSize(), Toolbar(), renderNode(), RichTextContent(), ALLOWED_TEXT_STYLES, EMPTY_RICH_TEXT_DOCUMENT, GAMEWEEK_MESSAGE_CHARACTER_LIMIT (+10 more)

### Community 64 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, dev, lint, local:dev, local:stop, staging:reset, staging:smoke (+6 more)

### Community 65 - "predictions/page.tsx"
Cohesion: 0.17
Nodes (10): AdminPredictionsPage(), dynamic, metadata, ParticipantSummary, Props, clockTimeForGameweek(), SeasonClockPosition, PredictionFixture (+2 more)

### Community 66 - "Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?, Source Nodes

### Community 67 - "Q: I just played a legitimate game and got the error: Your score could not be verified or saved."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I just played a legitimate game and got the error: Your score could not be verified or saved., Source Nodes

### Community 68 - "notices/page.tsx"
Cohesion: 0.27
Nodes (10): canManageScope(), createLoginNotice(), expireLoginNotice(), redirectWithError(), dynamic, LoginNoticesAdminPage(), metadata, Props (+2 more)

### Community 69 - "Q: The easter-egg prompt belongs on the player dashboard, and the cookie must suppress only prompts rather than game entry."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: The easter-egg prompt belongs on the player dashboard, and the cookie must suppress only prompts rather than game entry., Source Nodes

### Community 70 - "Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?, Source Nodes

### Community 71 - "Q: Oh, is there only one top score per user?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Oh, is there only one top score per user?, Source Nodes

### Community 72 - "Q: I've run migration 021, but the Unattached users tab is still unavailable"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I've run migration 021, but the Unattached users tab is still unavailable, Source Nodes

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
Cohesion: 0.13
Nodes (43): dynamic, filenamePart(), GET(), addCompleteness(), addFixtureAnalysis(), addForecastTendencies(), addLeaderboard(), addNotes() (+35 more)

### Community 92 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 93 - "Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive., Source Nodes

### Community 94 - "fixtures.ts"
Cohesion: 0.06
Nodes (55): main(), requiredEnvironment(), actionLogger(), assertExternalFixtureSyncEnabled(), correctResult(), failureEntry(), getProductionSeason(), SyncActionState (+47 more)

### Community 95 - "Q: Can you exclude any results that are not ascribed to a person who is actively a part of the league/season?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you exclude any results that are not ascribed to a person who is actively a part of the league/season?, Source Nodes

### Community 96 - "Q: Make the player dashboard easter-egg animation more elaborate every 30 seconds, including red flashing, spinning, and pulsing."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Make the player dashboard easter-egg animation more elaborate every 30 seconds, including red flashing, spinning, and pulsing., Source Nodes

### Community 99 - "context.ts"
Cohesion: 0.24
Nodes (9): cookieOptions, stopViewingAsLeagueAdmin(), viewAsCookieOptions, viewAsLeagueAdmin(), ADMIN_LEAGUE_COOKIE, ADMIN_SEASON_COOKIE, ADMIN_VIEW_AS_LEAGUE_COOKIE, AdminContext (+1 more)

### Community 102 - "Q: I keep getting random people who I think are from bot accounts signing up to the site. How would I add some protection against this?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I keep getting random people who I think are from bot accounts signing up to the site. How would I add some protection against this?, Source Nodes

### Community 104 - "participants/page.tsx"
Cohesion: 0.17
Nodes (17): approveJoinRequest(), createOfflineParticipant(), deleteUnattachedUser(), mergeOfflineParticipant(), rejectJoinRequest(), updateParticipantDisplayName(), dynamic, metadata (+9 more)

### Community 105 - "getUser"
Cohesion: 0.32
Nodes (11): assignLeagueAdmin(), createLeague(), deleteLeague(), regenerateInviteCode(), toggleInviteActive(), dynamic, LeagueTab, dynamic (+3 more)

### Community 106 - "Q: Once you've done this, can you also fix the styling on the admin dashboard, the policy links appear right at the bottom below the menu and cause a vertical scrollbar. Surely they could just be links at the bottom of the menu."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Once you've done this, can you also fix the styling on the admin dashboard, the policy links appear right at the bottom below the menu and cause a vertical scrollbar. Surely they could just be links at the bottom of the menu., Source Nodes

### Community 107 - "Q: In the admin screen, why does the header float in front of the breakout game?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: In the admin screen, why does the header float in front of the breakout game?, Source Nodes

### Community 108 - "types/index.ts"
Cohesion: 0.09
Nodes (25): calculateCompletion(), getResult(), LeaderboardEntry, RankedEntry, rankLeaderboard(), Result, Score, scorePrediction() (+17 more)

### Community 109 - "InviteLinkCopy.tsx"
Cohesion: 0.40
Nodes (4): CopyStatus, InviteLinkCopy(), Props, writeText

### Community 111 - "Q: The participants page is now giving React error 441 when I navigate to it"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: The participants page is now giving React error 441 when I navigate to it, Source Nodes

### Community 113 - "email-import-parser.ts"
Cohesion: 0.30
Nodes (12): aliasesFor(), aliasPattern(), candidateSegments(), collectFixtureScores(), EmailImportFixture, EmailParseResult, escapeRegExp(), generatedAliases() (+4 more)

### Community 125 - "AdminPredictionsForm.tsx"
Cohesion: 0.19
Nodes (8): AdminPredictionsForm(), Fixture, Option, ParticipantOption, Props, markGameweekMessagesRead(), { markMessagesReadMock }, participants

### Community 126 - "PredictionsForm.tsx"
Cohesion: 0.19
Nodes (9): Fixture, PredictionsForm(), Props, SCORE_WEIGHTS, TOTAL_WEIGHT, weightedRandomScore(), { clearPredictionsMock, submitPredictionsMock }, fixtures (+1 more)

### Community 127 - "ParticipantMergeDialog.tsx"
Cohesion: 0.60
Nodes (3): PARTICIPANT_MERGE_CONFIRMATION, ParticipantMergeDialog(), ParticipantOption

## Knowledge Gaps
- **527 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+522 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `ParticipantsAdminPage()` (7× useful, score=4.764933059) _(code changed — re-verify)_
- `CeefaxBreakout()` (5× useful, score=4.18801173)
- `AdminShell()` (5× useful, score=3.901497461)
- `DashboardPage()` (4× useful, score=2.705784557) _(code changed — re-verify)_
- `FixturesAdminPage()` (3× useful, score=2.378690702)
- `RegisterPage()` (3× useful, score=2.261292965) _(code changed — re-verify)_
- `signUp()` (3× useful, score=2.261292965) _(code changed — re-verify)_
- `submitJoinRequest()` (3× useful, score=1.863774062)
- `breakout-controls.test.ts` (2× useful, score=1.644014626)
- `getBreakoutLeaderboard()` (2× useful, score=1.642249695)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `createServiceClient` to `requireLeagueAdminForSeason`, `predictions/page.tsx`, `send-reminders/route.ts`, `context.ts`, `notices/page.tsx`, `auth/actions.ts`, `participants/page.tsx`, `getUser`, `gameweek-workbook.ts`, `predictions/actions.ts`, `AdminShell.tsx`, `server.ts`, `fixtures/page.tsx`, `getAdminContext`, `[seasonId]/page.tsx`, `AdminPredictionsForm.tsx`, `fixtures.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `createClient()` connect `server.ts` to `auth/actions.ts`, `participants/page.tsx`, `getUser`, `predictions/actions.ts`, `CeefaxBreakout.tsx`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `ApiFixture` connect `ApiFixture` to `fixtures.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _527 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `requireLeagueAdminForSeason` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `send-reminders/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061016949152542375 - nodes in this community are weakly interconnected._
- **Should `auth/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0903954802259887 - nodes in this community are weakly interconnected._