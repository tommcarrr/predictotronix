---
type: "query"
date: "2026-08-11T09:54:19.664123+00:00"
question: "Why is my ability to make predictions being blocked? Also can you stop offline users being highlighted as (offline) in leaderboards/exports etc...?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["DashboardPage()", "isKickoffLocked()", "getSeasonNow()", "get_season_leaderboard", "get_gameweek_leaderboard"]
---

# Q: Why is my ability to make predictions being blocked? Also can you stop offline users being highlighted as (offline) in leaderboards/exports etc...?

## Answer

Expanded from original query via graph vocab: [prediction, predictions, locked, clock, offline, leaderboard, export, exports, user]. The dashboard selected the earliest gameweek whose status was in_progress or upcoming, so a fully locked in-progress week hid a later open week. It now selects the earliest gameweek containing an unlocked fixture. Offline labels leaked because seeded display_name values literally ended in (offline), with another explicit season-admin badge; the seed, UI, and a cleanup migration now remove that presentation leakage.

## Outcome

- Signal: useful

## Source Nodes

- DashboardPage()
- isKickoffLocked()
- getSeasonNow()
- get_season_leaderboard
- get_gameweek_leaderboard