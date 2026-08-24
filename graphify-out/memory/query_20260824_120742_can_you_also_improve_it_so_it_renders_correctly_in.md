---
type: "query"
date: "2026-08-24T12:07:42.362954+00:00"
question: "Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive."
contributor: "graphify"
outcome: "useful"
source_nodes: ["CeefaxBreakout()", "breakout-controls.test.ts"]
---

# Q: Can you also improve it so it renders correctly in landscape on a mobile? Maybe with the left/right/fire buttons to the side of the game canvas? Possibly with a fire button on each side to make it intuitive.

## Answer

Expanded from the original request via graph vocabulary: [ceefax, breakout, controls, action, screen]. Traversal identified CeefaxBreakout() in src/components/admin/CeefaxBreakout.tsx as the game UI and breakout-controls.test.ts as its layout regression coverage. The landscape implementation belongs in that component and its colocated CSS Module, with mirrored Fire controls around the canvas and a compact short-viewport overlay.

## Outcome

- Signal: useful

## Source Nodes

- CeefaxBreakout()
- breakout-controls.test.ts