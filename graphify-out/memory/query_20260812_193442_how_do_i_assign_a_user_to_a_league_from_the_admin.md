---
type: "query"
date: "2026-08-12T19:34:42.230144+00:00"
question: "How do I assign a user to a league from the admin panel?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["ParticipantsAdminPage()", "approveJoinRequest()", "LeaguesAdminPage()", "assignLeagueAdmin()"]
---

# Q: How do I assign a user to a league from the admin panel?

## Answer

Expanded from original query via vocab: [admin, assign, league, participant, participants, user, users]. To add a registered user as a participant, select the league and season in the admin header, open Participants, and approve their pending join request. There is no direct picker for enrolling an arbitrary existing registered user. The Registered user picker under League settings assigns the league_admin role only. Offline participants can be added directly from Participants.

## Outcome

- Signal: useful

## Source Nodes

- ParticipantsAdminPage()
- approveJoinRequest()
- LeaguesAdminPage()
- assignLeagueAdmin()