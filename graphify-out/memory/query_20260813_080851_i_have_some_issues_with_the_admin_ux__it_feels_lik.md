---
type: "query"
date: "2026-08-13T08:08:51.436385+00:00"
question: "I have some issues with the admin UX, it feels like the screens are doing too much in one place, like the league settings screen having Create new league forms, deleting the leagues, setting admins etc... all in one place, it is just confusing. Could you look through all admin pages and think about a clearer approach? E.g having some tags or separate pages or modals where this makes sense."
contributor: "graphify"
outcome: "useful"
source_nodes: ["LeaguesAdminPage()", "SeasonsAdminPage()", "ParticipantsAdminPage()", "AdminShell()", "FixtureSyncConsole.tsx", "ExportPanel.tsx"]
---

# Q: I have some issues with the admin UX, it feels like the screens are doing too much in one place, like the league settings screen having Create new league forms, deleting the leagues, setting admins etc... all in one place, it is just confusing. Could you look through all admin pages and think about a clearer approach? E.g having some tags or separate pages or modals where this makes sense.

## Answer

Expanded from original query via graph vocabulary: [admin, page, settings, league, leagues, create, delete, role, user, users, season, audit]. Audit found the biggest responsibility collisions in League settings, Seasons, Participants, and Fixtures. Recommended a task-based sidebar; league directory plus league detail tabs for Overview, Invites, Admins, and Danger zone; seasons list plus dedicated create/detail flow; People tabs for Members and Join requests; contextual modals for short creation/edit/destructive actions; status badges for lifecycle and scope; and moving fixture sync debugging behind a Sync tab. Predictions and Standings should remain focused pages. Administration navigation must remain available on mobile.

## Outcome

- Signal: useful

## Source Nodes

- LeaguesAdminPage()
- SeasonsAdminPage()
- ParticipantsAdminPage()
- AdminShell()
- FixtureSyncConsole.tsx
- ExportPanel.tsx