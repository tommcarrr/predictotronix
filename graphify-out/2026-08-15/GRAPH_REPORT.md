# Graph Report - predictotronix  (2026-08-15)

## Corpus Check
- 187 files · ~75,365 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 950 nodes · 1805 edges · 72 communities (61 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- auth/index.ts
- send-reminders/route.ts
- createServiceClient
- devDependencies
- auth/actions.ts
- dependencies
- compilerOptions
- components.json
- Graphify Skill
- Predictotronix
- Predictotronix guide for superadmins
- PredictionsForm.tsx
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
- requireLeagueAdminForSeason
- Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing.
- [seasonId]/page.tsx
- Q: How do I assign a user to a league from the admin panel?
- Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?
- opengraph-image.tsx
- AdminShell.tsx
- Q: Can you talk me through the proposed changes to the flow to make this work?
- Predictotronix guide for players
- Predictotronix guide for league admins
- Q: Give me a nice way to copy the invite link to the clipboard.
- FixtureClipboardExport.tsx
- dashboard/page.tsx
- email-import-parser.ts
- predictions/page.tsx
- InviteLinkCopy.tsx
- types/index.ts
- predictions/actions.ts
- fixtures/actions.ts
- test-tools/page.tsx
- context.ts
- [leagueId]/page.tsx
- QuickMatchGame.tsx
- app/page.tsx

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
- `main()` --calls--> `assertSafeStagingTarget()`  [EXTRACTED]
  scripts/staging/reset.mts → src/lib/environment.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Extraction and Query Lifecycle** — codex_skills_graphify_skill_ast_structural_extraction, codex_skills_graphify_skill_semantic_extraction_pipeline, codex_skills_graphify_references_query_graph_query_workflows, codex_skills_graphify_references_update_incremental_graph_update [EXTRACTED 1.00]
- **Predictotronix Operational Platform** — readme_supabase_backend, readme_render_deployment, readme_scheduled_sync_jobs, setup_render_cron_containers [INFERRED 0.85]
- **Predictotronix Quality Gate** — agents_verify_before_completion, github_workflows_ci_ci_pipeline, github_workflows_ci_verify_job [EXTRACTED 1.00]

## Communities (72 total, 11 thin omitted)

### Community 0 - "auth/index.ts"
Cohesion: 0.26
Nodes (13): DashboardPage(), saveNotificationPreferences(), dynamic, metadata, SettingsPage(), getParticipant(), isAdmin(), isSeasonParticipant() (+5 more)

### Community 1 - "send-reminders/route.ts"
Cohesion: 0.06
Nodes (43): main(), requiredEnvironment(), claimReminderDelivery(), DeliveryClaim, dynamic, POST(), ServiceClient, validateCronSecret() (+35 more)

### Community 2 - "createServiceClient"
Cohesion: 0.17
Nodes (21): setAdminLeague(), ExportsAdminPage(), FixturesAdminPage(), LeagueDetailPage(), LeaguesAdminPage(), AdminDashboardPage(), dynamic, metadata (+13 more)

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+27 more)

### Community 4 - "auth/actions.ts"
Cohesion: 0.08
Nodes (53): GET(), dynamic, ForgotPasswordPage(), metadata, submitJoinRequest(), dynamic, JoinPage(), Props (+45 more)

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

### Community 11 - "PredictionsForm.tsx"
Cohesion: 0.19
Nodes (9): Fixture, PredictionsForm(), Props, QuickMatchFixture, SCORE_WEIGHTS, TOTAL_WEIGHT, weightedRandomScore(), { clearPredictionsMock, submitPredictionsMock } (+1 more)

### Community 12 - "exports/page.tsx"
Cohesion: 0.21
Nodes (10): dynamic, metadata, ExportPanel(), Format, formats, GameweekStandings, getMovementLabel(), LeaderboardRow (+2 more)

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

### Community 46 - "requireLeagueAdminForSeason"
Cohesion: 0.11
Nodes (28): correctResult(), addSeasonParticipant(), createSeason(), deleteSeason(), removeSeasonParticipant(), updateSeasonStatus(), Format, formatLeaderboard() (+20 more)

### Community 47 - "Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing., Source Nodes

### Community 48 - "[seasonId]/page.tsx"
Cohesion: 0.11
Nodes (28): dynamic, metadata, dynamic, metadata, Props, metadata, NewSeasonPage(), dynamic (+20 more)

### Community 50 - "Q: How do I assign a user to a league from the admin panel?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How do I assign a user to a league from the admin panel?, Source Nodes

### Community 52 - "Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?, Source Nodes

### Community 53 - "opengraph-image.tsx"
Cohesion: 0.43
Nodes (4): alt, contentType, scores, size

### Community 54 - "AdminShell.tsx"
Cohesion: 0.15
Nodes (11): setAdminSeason(), AdminLayout(), AdminShell(), configureNav, NavItem, Option, Props, runNav (+3 more)

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

### Community 60 - "dashboard/page.tsx"
Cohesion: 0.18
Nodes (11): ActiveSeason, dynamic, metadata, PendingJoinRequest, Props, GameweekCarousel(), Props, PredictionFixture (+3 more)

### Community 61 - "email-import-parser.ts"
Cohesion: 0.30
Nodes (12): aliasesFor(), aliasPattern(), candidateSegments(), collectFixtureScores(), EmailImportFixture, EmailParseResult, escapeRegExp(), generatedAliases() (+4 more)

### Community 62 - "predictions/page.tsx"
Cohesion: 0.16
Nodes (11): dynamic, metadata, Props, AdminPredictionsForm(), Fixture, Option, ParticipantOption, Props (+3 more)

### Community 63 - "InviteLinkCopy.tsx"
Cohesion: 0.40
Nodes (4): CopyStatus, InviteLinkCopy(), Props, writeText

### Community 64 - "types/index.ts"
Cohesion: 0.13
Nodes (19): calculateCompletion(), getResult(), LeaderboardEntry, RankedEntry, rankLeaderboard(), Result, Score, scorePrediction() (+11 more)

### Community 65 - "predictions/actions.ts"
Cohesion: 0.24
Nodes (11): adminExtractEmailPredictions(), ClearPredictionsResult, ExtractEmailPredictionsResult, PredictionInput, SubmitPredictionsResult, ChatCompletionResponse, extractPredictionsWithLlm(), getPredictionImportLlmConfig() (+3 more)

### Community 66 - "fixtures/actions.ts"
Cohesion: 0.14
Nodes (25): actionLogger(), assertExternalFixtureSyncEnabled(), failureEntry(), getProductionSeason(), SyncActionState, triggerFixtureSync(), triggerResultSync(), POST() (+17 more)

### Community 67 - "test-tools/page.tsx"
Cohesion: 0.17
Nodes (18): clearSeasonClock(), fastForwardGameweek(), guardActiveSeason(), guardTestSeason(), injectResult(), markFixturePostponed(), requireStagingSuperAdmin(), requireSuperAdmin() (+10 more)

### Community 68 - "context.ts"
Cohesion: 0.24
Nodes (9): cookieOptions, stopViewingAsLeagueAdmin(), viewAsCookieOptions, viewAsLeagueAdmin(), ADMIN_LEAGUE_COOKIE, ADMIN_SEASON_COOKIE, ADMIN_VIEW_AS_LEAGUE_COOKIE, AdminContext (+1 more)

### Community 69 - "[leagueId]/page.tsx"
Cohesion: 0.45
Nodes (9): assignLeagueAdmin(), createLeague(), deleteLeague(), regenerateInviteCode(), toggleInviteActive(), dynamic, LeagueTab, getUser (+1 more)

### Community 70 - "QuickMatchGame.tsx"
Cohesion: 0.24
Nodes (9): ChanceResult, createTargetPosition(), GamePhase, markerPositionAtElapsed(), Props, QuickMatchGame(), resolveQuickMatchChance(), Score (+1 more)

## Knowledge Gaps
- **382 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+377 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `ParticipantsAdminPage()` (6× useful, score=5.877174945) _(code changed — re-verify)_
- `DashboardPage()` (3× useful, score=2.92913264) _(code changed — re-verify)_
- `submitJoinRequest()` (3× useful, score=2.908807059) _(code changed — re-verify)_
- `SeasonsAdminPage()` (2× useful, score=1.987153102) _(code changed — re-verify)_
- `AdminShell()` (2× useful, score=1.987153102) _(code changed — re-verify)_
- `approveJoinRequest()` (2× useful, score=1.979731065) _(code changed — re-verify)_
- `JoinPage()` (2× useful, score=1.97921594) _(code changed — re-verify)_
- `LoginPage()` (2× useful, score=1.97921594) _(code changed — re-verify)_
- `RegisterPage()` (2× useful, score=1.97921594) _(code changed — re-verify)_
- `signIn()` (2× useful, score=1.97921594) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `createServiceClient` to `send-reminders/route.ts`, `fixtures/actions.ts`, `test-tools/page.tsx`, `context.ts`, `[leagueId]/page.tsx`, `auth/actions.ts`, `predictions/actions.ts`, `exports/page.tsx`, `requireLeagueAdminForSeason`, `[seasonId]/page.tsx`, `predictions/page.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `ApiFixture` connect `ApiFixture` to `fixtures/actions.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `createClient()` connect `auth/actions.ts` to `auth/index.ts`, `predictions/actions.ts`, `createServiceClient`, `[leagueId]/page.tsx`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _382 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `send-reminders/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060496067755595885 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `auth/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07525150905432595 - nodes in this community are weakly interconnected._