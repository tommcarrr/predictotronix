---
type: "query"
date: "2026-08-24T08:54:01.327329+00:00"
question: "Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["CeefaxBreakout()", "getBreakoutLeaderboard()", "submitBreakoutScore()", "get_breakout_leaderboard", "LEVEL_LAYOUTS"]
---

# Q: Where do I see the scoreboard, can I see the top 10 overall scores, and will everyone who completes the game have the same score? What scoring differentiators should we add?

## Answer

Expanded from graph vocab: [breakout, leaderboard, scores, score, submit, level, points, rank, brick, game]. The leaderboard is only visible on the non-playing overlay (splash, pause, game over, and win), and the component deliberately slices the league-scoped results to five entries even though the database RPC returns up to twenty. There is no global cross-league top-ten view. Current completion scoring is deterministic: levels award fixed points per brick hit and destruction, totalling 43,150 for every player who clears all five levels. Life loss, elapsed time, and combos do not affect score; equal scores are ordered by earliest achieved_at. Recommended: show ten entries and add a League/Global toggle; use a global RPC that deduplicates each participant to their best result. Differentiate scores with a modest brick-streak bonus, a 1,000-point life-loss penalty, and a 3,000-point no-loss completion bonus, while storing duration/lives_lost/max_combo for display and tie-breaking. Update the score ceiling and consider server-side validation because the current server action trusts any client integer within the cap.

## Outcome

- Signal: useful

## Source Nodes

- CeefaxBreakout()
- getBreakoutLeaderboard()
- submitBreakoutScore()
- get_breakout_leaderboard
- LEVEL_LAYOUTS