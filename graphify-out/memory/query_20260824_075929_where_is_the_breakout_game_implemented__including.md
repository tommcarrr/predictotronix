---
type: "query"
date: "2026-08-24T07:59:29.750832+00:00"
question: "Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["CeefaxBreakout()", "createBricks()", "drawGame()", "hitsBrick()", "breakout-controls.test.ts"]
---

# Q: Where is the breakout game implemented, including its buttons, powerups, level layouts, bricks, collision handling, and tests?

## Answer

Expanded from original query via graph vocab: [breakout, brick, bricks, power, level, button, ball, health, hits, layout]. The game is implemented in src/components/admin/CeefaxBreakout.tsx: createBricks builds levels, drawGame renders the canvas, hitsBrick performs collision detection, and CeefaxBreakout owns controls and the game loop. Button styling is in CeefaxBreakout.module.css and control coverage is in tests/unit/breakout-controls.test.ts.

## Outcome

- Signal: useful

## Source Nodes

- CeefaxBreakout()
- createBricks()
- drawGame()
- hitsBrick()
- breakout-controls.test.ts