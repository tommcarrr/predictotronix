---
type: "query"
date: "2026-08-27T19:37:35.043346+00:00"
question: "Make the player dashboard easter-egg animation more elaborate every 30 seconds, including red flashing, spinning, and pulsing."
contributor: "graphify"
outcome: "useful"
source_nodes: ["PlayerAccessibilityToggle", "DashboardPage", "SECRET_GAME_INVITE_DELAY_MS"]
---

# Q: Make the player dashboard easter-egg animation more elaborate every 30 seconds, including red flashing, spinning, and pulsing.

## Answer

Expanded via graph vocabulary: [player, dashboard, accessibility, toggle, prompt, animate, cookie, game]. PlayerAccessibilityToggle now increments an elapsed hint level every 30 seconds up to four stages, while clicks can accelerate the same level. CSS progresses from wiggle to pulse, red alert, then a multicolour 360-degree spin and scale routine; reduced-motion alternatives remain static. Cookie behavior remains prompt-only.

## Outcome

- Signal: useful

## Source Nodes

- PlayerAccessibilityToggle
- DashboardPage
- SECRET_GAME_INVITE_DELAY_MS