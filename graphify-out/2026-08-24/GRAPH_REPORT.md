# Graph Report - predictotronix  (2026-08-24)

## Corpus Check
- 216 files · ~89,499 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1208 nodes · 2227 edges · 82 communities (69 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- leaderboard.ts
- send-reminders/route.ts
- breakout-controls.test.ts
- devDependencies
- auth/actions.ts
- dependencies
- compilerOptions
- components.json
- /graphify
- Predictotronix
- Predictotronix guide for superadmins
- QuickMatchGame.tsx
- fixtures.ts
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
- server.ts
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
- createServiceClient
- Q: How do I assign a user to a league from the admin panel?
- Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?
- opengraph-image.tsx
- predictions/actions.ts
- Q: Can you talk me through the proposed changes to the flow to make this work?
- Part 2 — Render (deploys the app to the internet)
- leagues/page.tsx
- Q: Give me a nice way to copy the invite link to the clipboard.
- run.ts
- getAdminContext
- context.ts
- Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?
- fixtures/page.tsx
- CeefaxBreakout.tsx
- InviteLinkCopy.tsx
- Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?
- FixtureClipboardExport.tsx
- graphify reference: extra exports and benchmark
- graphify reference: query, path, explain
- Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?
- Q: Oh, is there only one top score per user?
- AGENTS.md
- graphify reference: add a URL and watch a folder
- Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results.
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- breakout-migration.test.ts
- extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 73 edges
2. `createClient()` - 33 edges
3. `getAdminContext` - 28 edges
4. `getUser` - 27 edges
5. `normalizeInviteCode()` - 25 edges
6. `requireLeagueAdminForSeason()` - 22 edges
7. `requireUser()` - 21 edges
8. `/graphify` - 21 edges
9. `isSuperAdmin()` - 19 edges
10. `ApiFixture` - 18 edges

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

## Communities (82 total, 13 thin omitted)

### Community 0 - "leaderboard.ts"
Cohesion: 0.07
Nodes (39): dynamic, ExportsAdminPage(), metadata, contentType(), GET(), validFormats, dynamic, GET() (+31 more)

### Community 1 - "send-reminders/route.ts"
Cohesion: 0.09
Nodes (30): claimReminderDelivery(), DeliveryClaim, dynamic, POST(), ServiceClient, validateCronSecret(), BrandedEmailParams, EmailResult (+22 more)

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

### Community 8 - "/graphify"
Cohesion: 0.05
Nodes (42): Graphify-First Codebase Navigation, Add and Watch Workflows, Graph Export Formats, Confidence and Provenance Classification, Semantic Extraction Specification, Cross-Repository Graph Merge, Graphify Hooks, Graph Query, Path, and Explain Workflows (+34 more)

### Community 9 - "Predictotronix"
Cohesion: 0.07
Nodes (32): Next.js Breaking Changes Guidance, 1. Prerequisites, 2. Clone and install, 3. Environment variables, 4. Run database migrations, 5. Add the Ceefax font, 6. Grant yourself super admin, 7. Run locally (+24 more)

### Community 10 - "Predictotronix guide for superadmins"
Cohesion: 0.05
Nodes (38): 10. Complete, archive and delete safely, 11. Use test-season tools, 12. Routine operating checklists, 1. Always check the current workspace, 2. Create a league, 3. Manage invitations, 4. Assign a league admin, 5. Create and activate a season (+30 more)

### Community 11 - "QuickMatchGame.tsx"
Cohesion: 0.09
Nodes (24): Fixture, PredictionsForm(), Props, CHANCE_SEQUENCE, ChanceProfile, chanceProfileForRound(), ChanceResult, ChanceType (+16 more)

### Community 12 - "fixtures.ts"
Cohesion: 0.06
Nodes (52): actionLogger(), assertExternalFixtureSyncEnabled(), correctResult(), failureEntry(), getProductionSeason(), SyncActionState, triggerFixtureSync(), triggerResultSync() (+44 more)

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

### Community 27 - "server.ts"
Cohesion: 0.15
Nodes (19): approveJoinRequest(), createOfflineParticipant(), rejectJoinRequest(), updateParticipantDisplayName(), dynamic, metadata, ParticipantsAdminPage(), Props (+11 more)

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
Cohesion: 0.09
Nodes (22): setAdminLeague(), setAdminSeason(), AdminShell(), configureNav, NavItem, Option, Props, runNav (+14 more)

### Community 47 - "Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing., Source Nodes

### Community 48 - "createServiceClient"
Cohesion: 0.15
Nodes (29): assignLeagueAdmin(), createLeague(), deleteLeague(), regenerateInviteCode(), toggleInviteActive(), dynamic, LeagueTab, clearSeasonClock() (+21 more)

### Community 50 - "Q: How do I assign a user to a league from the admin panel?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How do I assign a user to a league from the admin panel?, Source Nodes

### Community 52 - "Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?, Source Nodes

### Community 53 - "opengraph-image.tsx"
Cohesion: 0.43
Nodes (4): alt, contentType, scores, size

### Community 54 - "predictions/actions.ts"
Cohesion: 0.10
Nodes (31): AdminPredictionsForm(), Fixture, Option, ParticipantOption, Props, adminExtractEmailPredictions(), adminSubmitPredictions(), ClearPredictionsResult (+23 more)

### Community 55 - "Q: Can you talk me through the proposed changes to the flow to make this work?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you talk me through the proposed changes to the flow to make this work?, Source Nodes

### Community 56 - "Part 2 — Render (deploys the app to the internet)"
Cohesion: 0.04
Nodes (45): 1. Open and select the workspace, 2. Manage seasons, 3. Manage people, 4. Manage predictions, 5. Manage fixtures and results, 6. Review and export standings, Predictotronix guide for league admins, Quick reference (+37 more)

### Community 57 - "leagues/page.tsx"
Cohesion: 0.19
Nodes (14): dynamic, LeaguesAdminPage(), metadata, Props, metadata, NewSeasonPage(), AdminDialog(), AdminNotice() (+6 more)

### Community 58 - "Q: Give me a nice way to copy the invite link to the clipboard."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Give me a nice way to copy the invite link to the clipboard., Source Nodes

### Community 59 - "run.ts"
Cohesion: 0.07
Nodes (41): main(), requiredEnvironment(), POST(), validateCronSecret(), POST(), validateCronSecret(), dynamic, GET() (+33 more)

### Community 60 - "getAdminContext"
Cohesion: 0.17
Nodes (14): LeagueDetailPage(), AdminDashboardPage(), dynamic, metadata, dynamic, metadata, Props, SeasonsAdminPage() (+6 more)

### Community 61 - "context.ts"
Cohesion: 0.24
Nodes (9): cookieOptions, stopViewingAsLeagueAdmin(), viewAsCookieOptions, viewAsLeagueAdmin(), ADMIN_LEAGUE_COOKIE, ADMIN_SEASON_COOKIE, ADMIN_VIEW_AS_LEAGUE_COOKIE, AdminContext (+1 more)

### Community 62 - "Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?, Source Nodes

### Community 63 - "fixtures/page.tsx"
Cohesion: 0.20
Nodes (10): dynamic, FixturesAdminPage(), metadata, AdminPredictionsPage(), dynamic, metadata, Props, clockTimeForGameweek() (+2 more)

### Community 64 - "CeefaxBreakout.tsx"
Cohesion: 0.06
Nodes (70): AdminLayout(), ActiveSeason, DashboardPage(), dynamic, metadata, PendingJoinRequest, Props, saveNotificationPreferences() (+62 more)

### Community 65 - "InviteLinkCopy.tsx"
Cohesion: 0.40
Nodes (4): CopyStatus, InviteLinkCopy(), Props, writeText

### Community 66 - "Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?, Source Nodes

### Community 67 - "FixtureClipboardExport.tsx"
Cohesion: 0.21
Nodes (14): CopyStatus, datePartsFormatter, exportWeekdays, FixtureClipboardExport(), fixtureDateHeading(), FixtureExportGameweek, FixtureStatus, formatFixtureExport() (+6 more)

### Community 68 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 69 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 70 - "Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?, Source Nodes

### Community 71 - "Q: Oh, is there only one top score per user?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Oh, is there only one top score per user?, Source Nodes

### Community 72 - "AGENTS.md"
Cohesion: 0.50
Nodes (3): graphify, This is NOT the Next.js you know, Verify before completing any task

### Community 73 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 74 - "Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results., Source Nodes

### Community 75 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 76 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 79 - "breakout-migration.test.ts"
Cohesion: 0.50
Nodes (3): migration, originalMigration, verifiedMigration

## Knowledge Gaps
- **507 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+502 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `ParticipantsAdminPage()` (6× useful, score=4.585669398)
- `DashboardPage()` (3× useful, score=2.28545756)
- `submitJoinRequest()` (3× useful, score=2.269598513) _(code changed — re-verify)_
- `getBreakoutLeaderboard()` (2× useful, score=1.999838684)
- `submitBreakoutScore()` (2× useful, score=1.999838684)
- `CeefaxBreakout()` (2× useful, score=1.998875799) _(code changed — re-verify)_
- `PredictionsForm()` (2× useful, score=1.655009944)
- `SeasonsAdminPage()` (2× useful, score=1.550477441)
- `AdminShell()` (2× useful, score=1.550477441)
- `approveJoinRequest()` (2× useful, score=1.544686392) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `createServiceClient` to `leaderboard.ts`, `send-reminders/route.ts`, `auth/actions.ts`, `run.ts`, `fixtures.ts`, `AdminShell.tsx`, `predictions/actions.ts`, `leagues/page.tsx`, `server.ts`, `getAdminContext`, `context.ts`, `fixtures/page.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `createClient()` connect `CeefaxBreakout.tsx` to `createServiceClient`, `server.ts`, `auth/actions.ts`, `predictions/actions.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `getSeasonNow()` connect `fixtures/page.tsx` to `createServiceClient`, `send-reminders/route.ts`, `CeefaxBreakout.tsx`, `predictions/actions.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _507 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `leaderboard.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07111756168359942 - nodes in this community are weakly interconnected._
- **Should `send-reminders/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08717948717948718 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._