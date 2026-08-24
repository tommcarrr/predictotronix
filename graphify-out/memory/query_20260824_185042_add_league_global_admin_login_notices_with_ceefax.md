---
type: "query"
date: "2026-08-24T18:50:42.175370+00:00"
question: "Add league/global admin login notices with Ceefax theming, expiry, and dismissal frequency."
contributor: "graphify"
outcome: "useful"
source_nodes: ["LoginNotices", "DashboardPage()", "AdminShell()", "isLeagueAdmin()"]
---

# Q: Add league/global admin login notices with Ceefax theming, expiry, and dismissal frequency.

## Answer

Expanded from the original request via graph vocabulary: [admin, authorization, global, league, login, notice, participant, dashboard, theme, color, auth]. Implemented a secured /admin/notices workflow, login_notices and per-session dismissal persistence, and dashboard rendering through LoginNotices. Authorization follows getAdminContext, isSuperAdmin, and isLeagueAdmin; participant visibility is enforced by RLS. npm run verify passed with 220 tests and a Next.js 16.3 production build.

## Outcome

- Signal: useful

## Source Nodes

- LoginNotices
- DashboardPage()
- AdminShell()
- isLeagueAdmin()