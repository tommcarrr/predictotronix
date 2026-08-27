---
type: "query"
date: "2026-08-27T10:55:01.896754+00:00"
question: "On the dashboard screen, reduce the theme-button easter egg to four clicks, invite a click after 30 seconds with escalating intensity, and suppress repeats for a few months with a cookie."
contributor: "graphify"
outcome: "useful"
source_nodes: ["ThemeToggle", "DashboardPage", "PlayerAccessibilityToggle"]
---

# Q: On the dashboard screen, reduce the theme-button easter egg to four clicks, invite a click after 30 seconds with escalating intensity, and suppress repeats for a few months with a cookie.

## Answer

Expanded from original query via graph vocabulary: [dashboard, theme, button, animate, game, cookie]. The existing graph traversal was noisy, but DashboardPage, ThemeToggle, and PlayerAccessibilityToggle were verified in source. Implemented a shared four-press gate, dashboard-only escalating hint, and a 90-day started cookie.

## Outcome

- Signal: useful

## Source Nodes

- ThemeToggle
- DashboardPage
- PlayerAccessibilityToggle