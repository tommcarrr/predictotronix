# Graph Report - predictotronix  (2026-08-12)

## Corpus Check
- 125 files · ~49,090 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 626 nodes · 1100 edges · 43 communities (34 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `851c1502`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- server.ts
- createServiceClient
- environment.ts
- devDependencies
- scoring/index.ts
- dependencies
- compilerOptions
- components.json
- Graphify Skill
- Predictotronix
- Staging environment runbook
- fixtures/actions.ts
- exports/page.tsx
- Verify Before Completion
- app/layout.tsx
- button.tsx
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
- global.setup.ts
- scenario.mts
- local-dev.mjs
- Q: Why is my ability to make predictions being blocked? Also can you stop offline users being highlighted as (offline) in leaderboards/exports etc...?
- supabase-server.test.ts
- Q: Why are they locked at all?
- Q: Should I now be able to use the API sync to get the real fixtures for the upcoming season?
- ApiFixture

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 56 edges
2. `isSuperAdmin()` - 32 edges
3. `getUser` - 29 edges
4. `createClient()` - 28 edges
5. `getAdminContext` - 22 edges
6. `requireUser()` - 20 edges
7. `ApiFixture` - 18 edges
8. `compilerOptions` - 17 edges
9. `FixtureProvider` - 16 edges
10. `getParticipant()` - 16 edges

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

## Communities (43 total, 9 thin omitted)

### Community 0 - "server.ts"
Cohesion: 0.06
Nodes (59): AdminPredictionsPage(), dynamic, metadata, Props, submitJoinRequest(), dynamic, JoinPage(), Props (+51 more)

### Community 1 - "createServiceClient"
Cohesion: 0.07
Nodes (62): cookieOptions, setAdminLeague(), setAdminSeason(), correctResult(), dynamic, FixturesAdminPage(), metadata, assignLeagueAdmin() (+54 more)

### Community 2 - "environment.ts"
Cohesion: 0.09
Nodes (25): main(), requiredEnvironment(), dynamic, POST(), validateCronSecret(), dynamic, GET(), APP_ENVIRONMENTS (+17 more)

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+27 more)

### Community 4 - "scoring/index.ts"
Cohesion: 0.08
Nodes (28): clockTimeForGameweek(), SeasonClockPosition, calculateCompletion(), getResult(), LeaderboardEntry, RankedEntry, rankLeaderboard(), Result (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.04
Nodes (46): @base-ui/react, class-variance-authority, clsx, lucide-react, next, dependencies, @base-ui/react, class-variance-authority (+38 more)

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

### Community 10 - "Staging environment runbook"
Cohesion: 0.14
Nodes (13): 1. Create and configure Supabase staging, 2. Create the protected GitHub environment, 3. Create the Render staging service, 4. Apply migrations and create realistic data, 5. Create a test season manually, 6. Test different points in the season, 7. Acceptance checklist, Isolation and safety model (+5 more)

### Community 11 - "fixtures/actions.ts"
Cohesion: 0.13
Nodes (25): actionLogger(), assertExternalFixtureSyncEnabled(), failureEntry(), getProductionSeason(), SyncActionState, triggerFixtureSync(), triggerResultSync(), POST() (+17 more)

### Community 12 - "exports/page.tsx"
Cohesion: 0.19
Nodes (11): dynamic, ExportsAdminPage(), metadata, ExportPanel(), Format, formats, GameweekStandings, getMovementLabel() (+3 more)

### Community 13 - "Verify Before Completion"
Cohesion: 0.50
Nodes (5): Verify Before Completion, Agent Instructions Alias, CI Pipeline, Node.js 24 Runtime, Verify Job

### Community 14 - "app/layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 15 - "button.tsx"
Cohesion: 0.70
Nodes (3): Button(), buttonVariants, cn()

### Community 16 - "verify.mjs"
Cohesion: 0.50
Nodes (3): env, PLACEHOLDER_ENV, steps

### Community 18 - "Q: I have just spun up my staging environment and requested to join a league with a user, I can see the join request in my DB table, but it is not showing in the UI."
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: I have just spun up my staging environment and requested to join a league with a user, I can see the join request in my DB table, but it is not showing in the UI., Source Nodes

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

## Knowledge Gaps
- **250 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+245 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `getSeasonNow()` (2× useful, score=1.951442313)
- `isKickoffLocked()` (2× useful, score=1.951442313)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `createServiceClient` to `server.ts`, `environment.ts`, `fixtures/actions.ts`, `exports/page.tsx`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `ApiFixture` connect `ApiFixture` to `fixtures/actions.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `isSuperAdmin()` connect `createServiceClient` to `server.ts`, `fixtures/actions.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _250 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `server.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.058544303797468354 - nodes in this community are weakly interconnected._
- **Should `createServiceClient` be split into smaller, more focused modules?**
  _Cohesion score 0.06793206793206794 - nodes in this community are weakly interconnected._
- **Should `environment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._