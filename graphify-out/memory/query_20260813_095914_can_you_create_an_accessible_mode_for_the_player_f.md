---
type: "query"
date: "2026-08-13T09:59:14.806443+00:00"
question: "Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["PlayerAccessibilityMode", "AuthLayout", "ParticipantLayout"]
---

# Q: Can you create an accessible mode for the player facing screens (login/register/dashboard) that can be toggled?

## Answer

Expanded from original query via graph vocab: [login, register, dashboard, screen, toggle, theme, style, css, layout, form, button, settings]. Implemented PlayerAccessibilityMode as a persisted client preference shared by AuthLayout and ParticipantLayout. Enabled mode provides a readable sans-serif font, larger type and touch targets, a calmer high-contrast light palette, stronger focus indicators, improved prediction-input contrast, and reduced-motion support. Added unit coverage for button semantics and cross-screen localStorage persistence. npm run verify passed with 71 tests and the Next.js production build.

## Outcome

- Signal: useful

## Source Nodes

- PlayerAccessibilityMode
- AuthLayout
- ParticipantLayout