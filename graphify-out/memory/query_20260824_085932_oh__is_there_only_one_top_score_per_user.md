---
type: "query"
date: "2026-08-24T08:59:32.288827+00:00"
question: "Oh, is there only one top score per user?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["submitBreakoutScore()", "getBreakoutLeaderboard()", "breakout/actions.ts"]
---

# Q: Oh, is there only one top score per user?

## Answer

Expanded from graph vocab: [breakout, leaderboard, league, participant, score, scores, submit, user]. Yes, but specifically one personal-best score per participant per league. The league_breakout_scores primary key is (league_id, participant_id), and submit_breakout_score only replaces that row when the new score is higher. Lower or equal runs are discarded. A participant in multiple leagues can therefore have one stored best in each league; there is no history of individual attempts.

## Outcome

- Signal: useful

## Source Nodes

- submitBreakoutScore()
- getBreakoutLeaderboard()
- breakout/actions.ts