# Graph Report - predictotronix  (2026-08-04)

## Corpus Check
- 100 files · ~40,617 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 488 nodes · 873 edges · 38 communities (31 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ad34eee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth/index.ts
- createServiceClient
- fixtures/actions.ts
- devDependencies
- types/index.ts
- dependencies
- compilerOptions
- components.json
- Graphify Skill
- Predictotronix
- Staging environment
- environment.ts
- ExportPanel.tsx
- Verify Before Completion
- app/layout.tsx
- button.tsx
- verify.mjs
- architecture.test.ts
- File document icon
- Geographic latitude and longitude grid
- Next.js wordmark
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- Vercel logo
- Browser window icon
- global.setup.ts
- scenario.mts
- scripts

## God Nodes (most connected - your core abstractions)
1. `createServiceClient()` - 50 edges
2. `isSuperAdmin()` - 44 edges
3. `getUser` - 41 edges
4. `createClient()` - 28 edges
5. `requireUser()` - 21 edges
6. `compilerOptions` - 17 edges
7. `getParticipant()` - 16 edges
8. `scripts` - 12 edges
9. `ApiFixture` - 12 edges
10. `getEnvironmentPolicy()` - 12 edges

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

## Communities (38 total, 7 thin omitted)

### Community 0 - "auth/index.ts"
Cohesion: 0.09
Nodes (38): submitJoinRequest(), dynamic, JoinPage(), Props, dynamic, dynamic, DashboardPage(), dynamic (+30 more)

### Community 1 - "createServiceClient"
Cohesion: 0.11
Nodes (43): dynamic, ExportsAdminPage(), correctResult(), FixturesAdminPage(), createLeague(), regenerateInviteCode(), toggleInviteActive(), dynamic (+35 more)

### Community 2 - "fixtures/actions.ts"
Cohesion: 0.10
Nodes (22): assertExternalFixtureSyncEnabled(), getProductionSeasons(), triggerFixtureSync(), triggerResultSync(), dynamic, POST(), validateCronSecret(), POST() (+14 more)

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+27 more)

### Community 4 - "types/index.ts"
Cohesion: 0.08
Nodes (28): clockTimeForGameweek(), SeasonClockPosition, calculateCompletion(), getResult(), LeaderboardEntry, RankedEntry, rankLeaderboard(), Result (+20 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (29): @base-ui/react, class-variance-authority, clsx, lucide-react, next, dependencies, @base-ui/react, class-variance-authority (+21 more)

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

### Community 10 - "Staging environment"
Cohesion: 0.25
Nodes (7): Deployment outline, Deterministic scenario, GitHub staging environment, Isolation model, Safety controls, Staging environment, Testing different points in the season

### Community 11 - "environment.ts"
Cohesion: 0.10
Nodes (25): main(), requiredEnvironment(), dynamic, POST(), validateCronSecret(), dynamic, GET(), APP_ENVIRONMENTS (+17 more)

### Community 12 - "ExportPanel.tsx"
Cohesion: 0.29
Nodes (5): ExportPanel(), Format, LeaderboardRow, Props, Season

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

### Community 18 - "File document icon"
Cohesion: 0.67
Nodes (3): File document icon, Folded document corner, Horizontal text lines

### Community 19 - "Geographic latitude and longitude grid"
Cohesion: 1.00
Nodes (3): Geographic latitude and longitude grid, Globe icon, Spherical world

### Community 20 - "Next.js wordmark"
Cohesion: 0.67
Nodes (3): Next.js, Next.js wordmark, Black vector path artwork

### Community 32 - "scenario.mts"
Cohesion: 0.14
Nodes (23): assertCount(), ensurePersonaUser(), insertBatches(), main(), requiredEnvironment(), scoreCompletedFixtures(), addDays(), buildStagingScenario() (+15 more)

### Community 37 - "scripts"
Cohesion: 0.12
Nodes (15): name, private, scripts, build, dev, lint, staging:reset, staging:smoke (+7 more)

## Knowledge Gaps
- **190 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServiceClient()` connect `createServiceClient` to `auth/index.ts`, `fixtures/actions.ts`, `environment.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `isSuperAdmin()` connect `createServiceClient` to `auth/index.ts`, `fixtures/actions.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0936026936026936 - nodes in this community are weakly interconnected._
- **Should `createServiceClient` be split into smaller, more focused modules?**
  _Cohesion score 0.11380471380471381 - nodes in this community are weakly interconnected._
- **Should `fixtures/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10188261351052048 - nodes in this community are weakly interconnected._