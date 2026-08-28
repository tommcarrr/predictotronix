---
type: "query"
date: "2026-08-28T09:11:05.092121+00:00"
question: "In the admin screen, why does the header float in front of the breakout game?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["CeefaxBreakout()", "AdminShell()"]
---

# Q: In the admin screen, why does the header float in front of the breakout game?

## Answer

Expanded from original query via vocab: [admin, breakout, ceefax, game, header, layout, navigation, shell, index]. CeefaxBreakout has z-index 100, but AdminShell renders it beneath the sticky sidebar stacking context while the sticky header is a sibling at z-20. Portaling the overlay to document.body moves it to the root stacking context so it covers the header.

## Outcome

- Signal: useful

## Source Nodes

- CeefaxBreakout()
- AdminShell()