---
type: "query"
date: "2026-08-27T18:33:09.289339+00:00"
question: "The easter-egg prompt belongs on the player dashboard, and the cookie must suppress only prompts rather than game entry."
contributor: "graphify"
outcome: "corrected"
correction: "Place prompting only on PlayerAccessibilityToggle on the player dashboard; use the cookie only to suppress prompting, never to block four-click entry."
source_nodes: ["PlayerAccessibilityToggle", "ThemeToggle", "DashboardPage"]
---

# Q: The easter-egg prompt belongs on the player dashboard, and the cookie must suppress only prompts rather than game entry.

## Answer

Expanded via graph vocabulary: [player, dashboard, accessibility, toggle, prompt, cookie, game, theme]. Corrected the implementation so PlayerAccessibilityToggle alone owns the 30-second escalating prompt. The shared four-click gate remains available even when the 90-day prompt cookie exists; both entry points only write the cookie after launch.

## Outcome

- Signal: corrected
- Correction: Place prompting only on PlayerAccessibilityToggle on the player dashboard; use the cookie only to suppress prompting, never to block four-click entry.

## Source Nodes

- PlayerAccessibilityToggle
- ThemeToggle
- DashboardPage